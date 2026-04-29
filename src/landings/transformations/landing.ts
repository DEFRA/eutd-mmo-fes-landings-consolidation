const _ = require('lodash');

import moment from 'moment';
import { ILanding, ILandingItem, LandingSources, ILandingAggregatedItemBreakdown, ILandingQuery } from "mmo-shared-reference-data";
import { Catch, CatchCertificate, IConsolidateLanding, ILandingDetail, ILandingSpeciesIdx, Product } from '../../types';
import { getRssNumber } from '../../services/vessel.service';
import { getPreApprovedDocumentsMap } from '../persistence/preApprovedDocument';
import { getTotalRiskScore, isHighRisk } from '../../data/risking';
import logger from '../../logger';

export const transformLandings = (landings: ILanding[]): IConsolidateLanding[] =>
  _(landings)
    .sortBy(['rssNumber', 'dateTimeLanded'])
    .groupBy((landing: ILanding) => [landing.rssNumber, moment.utc(landing.dateTimeLanded).format('YYYY-MM-DD')])
    .map((items: ILanding[]) => ({
      rssNumber: items[0].rssNumber,
      dateLanded: moment.utc(items[0].dateTimeLanded).format('YYYY-MM-DD'),
      source: items[0].source,
      items: _(items)
        .map((l: ILanding) => ({ ...l, items: l.items.map((i: ILandingItem) => ({ ...i, source: l.source })) }))
        .flatMap('items')
        .sortBy('species')
        .groupBy('species')
        .map((_items: ILandingAggregatedItemBreakdown[], species: string) => {
          const isEstimate = _items.some((landing: ILandingAggregatedItemBreakdown) => !(landing.source && landing.source === LandingSources.LandingDeclaration));
          const landedWeight = _items.reduce((total: number, landing: ILandingAggregatedItemBreakdown) => {
            const factor = landing.factor ? landing.factor : 1;
            return total + factor * landing.weight;
          }, 0);
          return { species, isEstimate, landedWeight };
        }).value()
    })).value()

// FI0-11132: accept optional pre-fetched approval map to avoid N+1 queries
export const buildLandingsSpeciesIdx = async (documents: CatchCertificate[], landing: ILandingDetail, preApprovedMap?: Map<string, boolean>): Promise<ILandingSpeciesIdx> => {
  const speciesIdx: ILandingSpeciesIdx = {};

  // If no map provided, batch-fetch all approvals upfront
  const approvalMap = preApprovedMap ?? await getPreApprovedDocumentsMap(
    documents.filter(d => d.exportData).map(d => d.documentNumber)
  );

  for (const document of documents) {
    if (document.exportData) {
      const isDocumentApproved = approvalMap.get(document.documentNumber) || false;
      const products: Product[] = document.exportData.products;
      products.forEach((product: Product) => {
        if (product.caughtBy) {
          const landings = product.caughtBy.filter((curr: Catch) => (curr.pln === landing.pln && moment.utc(curr.date).isSame(moment.utc(landing.dateLanded), 'day')));
          landings.forEach((ctch: Catch) => {
            if (!Array.isArray(speciesIdx[product.speciesCode])) {
              speciesIdx[product.speciesCode] = [];
            }

            speciesIdx[product.speciesCode].push({
              documentNumber: document.documentNumber,
              landingId: ctch.id,
              weight: ctch.weight * product.factor,
              dataEverExpected: ctch.dataEverExpected,
              landingDataExpectedDate: ctch.landingDataExpectedDate,
              landingDataEndDate: ctch.landingDataEndDate,
              isPreApproved: isDocumentApproved,
              isHighRisk: isHighRisk(getTotalRiskScore(ctch.pln, product.speciesCode, document.exportData.exporterDetails?.accountId, document.exportData.exporterDetails?.contactId))
            })
          })
        }
      })
    }
  }


  return speciesIdx;
}

// FI0-11132: accept optional pre-fetched approval map to avoid N+1 queries
export const buildDocumentLandingsList = async (documents: CatchCertificate[], landingsIdx: any, preApprovedMap?: Map<string, boolean>): Promise<any[]> => {
  const list: any[] = [];

  // If no map provided, batch-fetch all approvals upfront
  const approvalMap = preApprovedMap ?? await getPreApprovedDocumentsMap(
    documents.filter(d => d.exportData).map(d => d.documentNumber)
  );

  for (const document of documents) {
    const isDocumentApproved = approvalMap.get(document.documentNumber) || false;
    if (document.exportData) {
      document.exportData.products.forEach((product: Product) => {
        if (product.caughtBy) {
          product.caughtBy.forEach((ctch: Catch) => {
            const rssNumber = getRssNumber(ctch.pln, moment(ctch.date).format('YYYY-MM-DD'));
            if (landingsIdx[rssNumber + ctch.date]) {
              list.push({
                species: product.speciesCode,
                documentNumber: document.documentNumber,
                landingId: ctch.id,
                weight: ctch.weight * product.factor,
                dataEverExpected: ctch.dataEverExpected,
                landingDataExpectedDate: ctch.landingDataExpectedDate,
                landingDataEndDate: ctch.landingDataEndDate,
                pln: ctch.pln,
                dateLanded: ctch.date,
                isPreApproved: isDocumentApproved
              });
            }
          })
        }
      })
    }
  }

  return list;
}

export function mapPlnLandingsToRssLandings(plnLandings: any[]): ILandingQuery[] {
  return plnLandings.reduce((rssNumberLandings: any[], plnLanding: any) => {
    const rssNumber = getRssNumber(plnLanding.pln, moment(plnLanding.dateLanded).format('YYYY-MM-DD'));

    if (!rssNumber) {
      logger.warn(`[LANDINGS-CONSOLIDATION][${plnLanding.pln}][${plnLanding.dateLanded}][NO-RSS-NUMBER]`);
      return rssNumberLandings
    }

    return [...rssNumberLandings, {
      rssNumber: rssNumber,
      dateLanded: plnLanding.dateLanded
    }]
  }, []);
}

export function uniquifyLandings(landingDetails: ILandingQuery[]): ILandingDetail[] {
  return landingDetails.reduce((landings: ILandingDetail[], landing: ILandingDetail) => {
    const hasLanding: ILandingDetail = landings.find((l: ILandingDetail) => _.isEqual(l, landing));
    if (hasLanding) {
      return landings;
    }

    return [...landings, landing]
  }, []);
}
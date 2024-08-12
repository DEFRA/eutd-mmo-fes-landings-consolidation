const _ = require('lodash');
import moment from "moment";
import { getCatchCertificate, getCatchCertificates } from "../landings/persistence/document";
import { getPlnsForLanding, getRssNumber } from "./vessel.service";
import {
  buildDocumentLandingsList,
  buildLandingsSpeciesIdx,
  mapPlnLandingsToRssLandings,
  transformLandings,
  uniquifyLandings
} from "../landings/transformations/landing";
import {
  CatchCertificate,
  ICatchCertificateLanding,
  ICatchCertificateSpecies,
  IConsolidateLanding,
  IConsolidateLandingItem,
  ILandingDetail,
  ILandingSpeciesIdx
} from "../types";
import {
  getRetrospectiveConsolidatedLandings,
  getConsolidationLandingsByRssNumber,
  getConsolidationLandingsByDocumentNumber,
  clearConsolidateLandings,
  updateConsolidateLanding
} from "../landings/persistence/consolidateLanding";
import { DocumentStatuses, ILanding, ILandingAggregated, ILandingQuery, LandingSources, aggregateOnLandingDate, getLandingsFromCatchCertificate } from "mmo-shared-reference-data";
import { isRetrospectiveCheckRequired } from "../landings/query/isWithinRetrospectivePeriod";
import { getLandings, getLandingsMultiple } from "../landings/persistence/landing";
import { getTotalRiskScore, isHighRisk } from "../data/risking";
import { isOverusedAllCerts } from "../landings/query/isOveruseAllCerts";
import { isWithinDeminimus } from "../landings/query/isWithinDeminimus";
import { getSpeciesAliases, refreshRiskingData } from "../data/cache";
import { TOLERANCE_IN_KG, getLandingSource } from "../data/constants";
import logger from "../logger";

const getSpeciesOnLanding: (species: string, speciesOnLanding: any) => any = (species: string, speciesOnLanding: any): any => {
  if (speciesOnLanding[species]) {
    return speciesOnLanding[species];
  }

  const speciesAliases: string[] = getSpeciesAliases(species);

  for (const key in speciesAliases) {
    const alias = speciesAliases[key];
    const speciesAliasOnLanding: any = speciesOnLanding[alias];
    if (speciesAliasOnLanding) {
      return speciesAliasOnLanding;
    }
  }

  return null;
};

export const runLandingsConsolidationJob = async (startDate: string, endDate: string): Promise<void> => {
  logger.info(`[LANDINGS-CONSOLIDATION][START-DATE][${startDate}][END-DATE][${endDate}]`);
  await clearConsolidateLandings(startDate, endDate);

  const systemLandings: ILanding[] = await getLandings(startDate, endDate);
  await startLandingsConsolidationJob(systemLandings);
};

export const startLandingsConsolidationJob = async (landings: ILanding[]): Promise<void> => {
  const transformedLandings: IConsolidateLanding[] = transformLandings(landings);
  logger.info(`[LANDINGS-CONSOLIDATION][LANDINGS][${transformedLandings.length}]`);
  await consolidateLandings(transformedLandings);
}

export const consolidateLandings = async (consolidatedLandings: IConsolidateLanding[]): Promise<void> => {
  await refreshRiskingData()
    .catch((e: Error) => logger.error(`[LANDING-CONSOLIDATION][REFRESH-RISKING-DATA][ERROR][${e}]`));

  for (const consolidatedLanding of consolidatedLandings) {
    // 1. Find all usages of this landing in exportCertificates
    logger.info(`[LANDINGS-CONSOLIDATION][FINDING-USAGES-FOR][${consolidatedLanding.rssNumber}-${consolidatedLanding.dateLanded}]`);
    //  a. convert rssNumber to pln e.g getPlnsForLandings
    const landingDetail: ILandingDetail | undefined = getPlnsForLanding({ rssNumber: consolidatedLanding.rssNumber, dateLanded: consolidatedLanding.dateLanded });

    if (!landingDetail?.pln) {
      logger.info(`[LANDINGS-CONSOLIDATION][NOT-FOUND-PLN][${consolidatedLanding.rssNumber}-${consolidatedLanding.dateLanded}]`);
      continue;
    }

    logger.info(`[LANDINGS-CONSOLIDATION][FOUND-PLN][${landingDetail.rssNumber}-${landingDetail.dateLanded}][PLN: ${landingDetail.pln}]`);

    //  b. get affected certs
    const affectedCatchCerts: CatchCertificate[] = await getCatchCertificates({ pln: landingDetail.pln, dateLanded: landingDetail.dateLanded });
    logger.info(`[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][${landingDetail.dateLanded}-${landingDetail.pln}][${affectedCatchCerts.length}]`);

    // 2. go through each certificate and create a dictionary of landings indexable by species
    const speciesIdxFromDocument: ILandingSpeciesIdx = await buildLandingsSpeciesIdx(affectedCatchCerts, landingDetail);
    logger.info(`[LANDINGS-CONSOLIDATION][NUMBER-OF-SPECIES-FOUND-ON-CATCH-CERTIFICATES][${landingDetail.dateLanded}-${landingDetail.pln}][${Object.keys(speciesIdxFromDocument).length}]`);

    // 3. iterate through all of the items to build landings array
    consolidatedLanding.items = buildLandingsArray(consolidatedLanding.items, speciesIdxFromDocument);

    // 4. calculate overuse and add isOverusedAllCerts true | false
    consolidatedLanding.items.forEach((item: IConsolidateLandingItem) => {
      item.isOverusedAllCerts = isOverusedAllCerts(item);
    });

    // 5. check for elog species mis-match within 50 KG deminimus
    if (consolidatedLanding.source === LandingSources.ELog) {
      const speciesListFromDocument: string[] = Object.keys(speciesIdxFromDocument);

      const withinDeminimusLandings: ICatchCertificateSpecies[] = reduceSpeciedList(speciesListFromDocument, consolidatedLanding, speciesIdxFromDocument);

      if (withinDeminimusLandings.length > 0) {
        withinDeminimusLandings.forEach((withinDeminimusLanding: ICatchCertificateSpecies) => {
          const itemToUpdate = consolidatedLanding.items.find((item: IConsolidateLandingItem) => item.species === withinDeminimusLanding.species);

          const { species, ...documentLanding } = withinDeminimusLanding;

          if (itemToUpdate) {
            itemToUpdate.landings.push({
              ...documentLanding
            });

            itemToUpdate.exportWeight = itemToUpdate.landings.reduce((totalWeight: number, l: ICatchCertificateLanding) => totalWeight + l.weight, 0);
            itemToUpdate.isWithinDeminimus = isWithinDeminimus(itemToUpdate, consolidatedLanding.source, null)
            return;
          }

          consolidatedLanding.items.push({
            species,
            isEstimate: consolidatedLanding.source !== LandingSources.LandingDeclaration,
            isWithinDeminimus: withinDeminimusLanding.weight <= TOLERANCE_IN_KG && isRetrospectiveCheckRequired(withinDeminimusLanding),
            exportWeight: withinDeminimusLanding.weight,
            landings: [{ ...withinDeminimusLanding }]
          })
        })
      }
    }

    await updateConsolidateLanding(consolidatedLanding)
      .catch((e: Error) => logger.error(`[LANDINGS-CONSOLIDATION][UPDATE-LANDINGS][ERROR][${e}]`));
  }
};

const buildLandingsArray = (inputArray: IConsolidateLandingItem[], speciesIdxFromDocument: ILandingSpeciesIdx) => {
  return inputArray.reduce((consolidatedLandingItems: IConsolidateLandingItem[], consolidatedLandingItem: IConsolidateLandingItem) => {
    const speciesLandings: ICatchCertificateLanding[] = speciesIdxFromDocument[consolidatedLandingItem.species];

    if (speciesLandings) {
      const tempConsolidate: IConsolidateLandingItem = {
        ...consolidatedLandingItem,
        exportWeight: speciesLandings.reduce((acc: number, l: ICatchCertificateLanding) => acc + l.weight, 0),
        landings: [...speciesLandings]
      }

      return isOverusedAllCerts(tempConsolidate) ? [...consolidatedLandingItems, tempConsolidate] : consolidatedLandingItems;
    }

    // check for species-alias
    const speciesAliases: string[] = getSpeciesAliases(consolidatedLandingItem.species);
    for (const key in speciesAliases) {
      const alias = speciesAliases[key];
      const speciesAliasOnCert: ICatchCertificateLanding[] = speciesIdxFromDocument[alias];
      if (speciesAliasOnCert) {
        const tempConsolidate: IConsolidateLandingItem = {
          ...consolidatedLandingItem,
          exportWeight: speciesAliasOnCert.reduce((acc: number, l: ICatchCertificateLanding) => acc + l.weight, 0),
          landings: [...speciesAliasOnCert]
        }

        return isOverusedAllCerts(tempConsolidate) ? [...consolidatedLandingItems, tempConsolidate] : consolidatedLandingItems;
      }
    }

    return consolidatedLandingItems;
  }, []);
};

const reduceSpeciedList = (speciesListFromDocument: string[], consolidatedLanding: IConsolidateLanding, speciesIdxFromDocument: ILandingSpeciesIdx) => {
  return speciesListFromDocument.reduce((acc: ICatchCertificateSpecies[], cur: string) => {
    const speciesAliases: string[] = getSpeciesAliases(cur);

    const speciesMatch: boolean = consolidatedLanding.items.some((item: IConsolidateLandingItem) => item.species === cur || speciesAliases.some((s: string) => item.species === s));
    if (speciesMatch) {
      return acc;
    }

    const speciesDocumentLandings: ICatchCertificateLanding[] = speciesIdxFromDocument[cur];
    speciesDocumentLandings.forEach((speciesDocumentLanding: ICatchCertificateLanding) => {

      if (speciesDocumentLanding.weight <= TOLERANCE_IN_KG) {
        acc.push({
          ...speciesDocumentLanding,
          species: cur
        })
      }
    });

    return acc;
  }, []);
}

export const updateConsolidateLandings = async (documentNumber: string) => {
  const catchCertificate: CatchCertificate = await getCatchCertificate(documentNumber, DocumentStatuses.Complete);
  if (!catchCertificate) {
    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][UPDATE][DOCUMENT-NOT-FOUND]`);
    return;
  }

  // 1. map through all of the landings to get pln and date landed
  const landingsFromCatificate = getLandingsFromCatchCertificate(catchCertificate);

  if (!Array.isArray(landingsFromCatificate) || landingsFromCatificate.length === 0) {
    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][UPDATE][NO-LANDING-ON-CC]`);
    return;
  }

  logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][UPDATE][NUMBER-OF-LANDING-ON-CC][${landingsFromCatificate.length}]`);

  // 2. with the pln I find the rssNumber
  const landingsQuery: ILandingQuery[] = mapPlnLandingsToRssLandings(landingsFromCatificate);

  if (!Array.isArray(landingsQuery) || landingsQuery.length === 0) {
    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][UPDATE][NO-LANDING-ON-CC-WITH-RSS-NUMBER]`);
    return;
  }

  logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][UPDATE][NUMBER-OF-LANDING-ON-CC-WITH-RSS-NUMBER][${landingsQuery.length}]`);

  // 3. uniquify the landings
  const landingsQueryList: ILandingQuery[] = uniquifyLandings(landingsQuery);

  logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][UPDATE][NUMBER-OF-UNIQUE-LANDINGS][${landingsQueryList.length}]`);

  // 4. check that we have a landings for the given rssNumber and dateLanded
  const landings: ILanding[] = await getLandingsMultiple(landingsQueryList);

  if (!Array.isArray(landings) || landings.length <= 0) {
    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][NO-LANDINGS]`);
    return;
  }

  logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][NEW-LANDINGS][${landings.length}]`);

  await refreshRiskingData()
    .catch((e: Error) => logger.error(`[LANDING-CONSOLIDATION][${documentNumber}][REFRESH-RISKING-DATA][ERROR][${e}]`));

  const allCatchCertificates: CatchCertificate[] = await findAllCatchCertificates(landings);
  logger.info(`[LANDINGS-CONSOLIDATION][TOTAL-NUMBER-OF-CATCH-CERTIFICATES][${allCatchCertificates.length}]`);

  const aggregatedLandings: ILandingAggregated[] = aggregateOnLandingDate(landings);

  const landingsIdx = aggregatedLandings.reduce((acc, cur) => ({ ...acc, [cur.rssNumber + cur.dateLanded]: cur }), {});

  logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][LANDINGS-INDEXED]`);

  const documentLandingsIdx = _.groupBy(await buildDocumentLandingsList(allCatchCertificates, landingsIdx), (o: any) => o.pln + ',' + o.dateLanded);

  const consolidatedLandingsByRssNumber: IConsolidateLanding[] = await getConsolidationLandingsByRssNumber(
    landings.map(({ rssNumber, dateTimeLanded }) => ({
      rssNumber,
      dateLanded: dateTimeLanded
    }))
  );

  for (const key in documentLandingsIdx) {
    const [pln, dateLanded] = key.split(',');
    const rssNumber = getRssNumber(pln, moment(dateLanded).format('YYYY-MM-DD'));
    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][documentSpeciesIdxCycle][${rssNumber}-${dateLanded}]`);

    const aggregatedLanding: ILandingAggregated = landingsIdx[rssNumber + dateLanded];
    const landingSource = aggregatedLanding.items[0] ? aggregatedLanding.items[0].breakdown[0].source : undefined;
    const landingWeightBySpecies = aggregatedLanding.items.reduce((acc, cur) => ({ ...acc, [cur.species]: { weight: cur.weight, source: cur.breakdown[0].source, isEstimate: cur.breakdown[0].isEstimate } }), {});

    let consolidatedLanded: IConsolidateLanding = consolidatedLandingsByRssNumber.find((consolidatedLandingByRssNumber: IConsolidateLanding) => consolidatedLandingByRssNumber.rssNumber === rssNumber);

    if (!consolidatedLanded) {
      logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][BUILDING-CONSOLIDATION-LANDING-FOR][${rssNumber}-${dateLanded}]`);

      // build
      consolidatedLanded = {
        rssNumber: rssNumber,
        dateLanded: moment.utc(dateLanded).format('YYYY-MM-DD'),
        items: []
      }
    }

    const itemsSpeciesIdx: { [key: string]: IConsolidateLandingItem } = consolidatedLanded.items.reduce((acc, cur) => ({ ...acc, [cur.species]: cur }), {});

    documentLandingsIdx[key].forEach((documentLanding: any) => {
      logger.info(`[LANDING-CONSOLIDATION][${rssNumber}-${dateLanded}][DOCUMENT][${documentNumber}][EXPORT-LANDING][${documentLanding.landingId}]`);
      updateLandingSpeciesIdx(documentLanding, itemsSpeciesIdx, consolidatedLanded, landingWeightBySpecies, landingSource, catchCertificate, pln);
    });

    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][UPDATING-CONSOLIDATE-LANDING][${rssNumber}-${dateLanded}]`);
    await updateConsolidateLanding(consolidatedLanded)
      .catch((e: Error) => logger.error(`[LANDINGS-CONSOLIDATION][UPDATE-LANDINGS][ERROR][${e}]`));
  }

};

const updateLandingSpeciesIdx = (documentLanding: any, itemsSpeciesIdx: { [key: string]: IConsolidateLandingItem }, consolidatedLanded: IConsolidateLanding, landingWeightBySpecies: any, landingSource: any, catchCertificate: CatchCertificate, pln: string) => {
  const containsLanding: () => boolean = () => itemsSpeciesIdx[documentLanding.species].landings.some((landing: ICatchCertificateLanding) => landing.landingId === documentLanding.landingId)

  if (!itemsSpeciesIdx[documentLanding.species]) {
    logger.info(`[LANDING-CONSOLIDATION][EXPORT-LANDING][${documentLanding.landingId}][NO-SPECIES-FOUND][ADDING]`);

    itemsSpeciesIdx[documentLanding.species] = {
      species: documentLanding.species
    }
  }

  if (!itemsSpeciesIdx[documentLanding.species].landings) {
    logger.info(`[LANDING-CONSOLIDATION][EXPORT-LANDING][${documentLanding.landingId}][${JSON.stringify(itemsSpeciesIdx[documentLanding.species])}][NO-LANDING-FOUND][ADDING]`);

    itemsSpeciesIdx[documentLanding.species].landings = [];
  }

  const landedWeightBySpecies = getSpeciesOnLanding(documentLanding.species, landingWeightBySpecies);
  if (!landedWeightBySpecies && landingSource !== LandingSources.ELog) {
    logger.info(`[LANDING-CONSOLIDATION][EXPORT-LANDING][${documentLanding.landingId}][SPECIES-MIS-MATCH][${documentLanding.species}]`);
    return;
  }

  if (!containsLanding()) {
    itemsSpeciesIdx[documentLanding.species].landings.push({
      landingId: documentLanding.landingId,
      documentNumber: documentLanding.documentNumber,
      weight: documentLanding.weight,
      dataEverExpected: documentLanding.dataEverExpected,
      landingDataExpectedDate: documentLanding.landingDataExpectedDate,
      landingDataEndDate: documentLanding.landingDataEndDate,
      isPreApproved: documentLanding.isPreApproved,
      isHighRisk: isHighRisk(getTotalRiskScore(pln, documentLanding.species, catchCertificate.exportData.exporterDetails?.accountId, catchCertificate.exportData.exporterDetails?.contactId))
    });
  }

  itemsSpeciesIdx[documentLanding.species].landedWeight = landedWeightBySpecies ? landedWeightBySpecies.weight : 0;
  itemsSpeciesIdx[documentLanding.species].isEstimate = landedWeightBySpecies ? landedWeightBySpecies.isEstimate : landingSource !== LandingSources.LandingDeclaration;
  itemsSpeciesIdx[documentLanding.species].exportWeight = itemsSpeciesIdx[documentLanding.species].landings.reduce((acc: number, l: ICatchCertificateLanding) => acc + l.weight, 0);
  itemsSpeciesIdx[documentLanding.species].isOverusedAllCerts = isOverusedAllCerts(itemsSpeciesIdx[documentLanding.species]);
  itemsSpeciesIdx[documentLanding.species].isWithinDeminimus = isWithinDeminimus(itemsSpeciesIdx[documentLanding.species], getLandingSource(landingSource), landedWeightBySpecies);

  if (itemsSpeciesIdx[documentLanding.species].isOverusedAllCerts || itemsSpeciesIdx[documentLanding.species].isWithinDeminimus) {
    consolidatedLanded.items = consolidatedLanded.items.filter((c: IConsolidateLandingItem) => c.species !== documentLanding.species);
    consolidatedLanded.items.push(itemsSpeciesIdx[documentLanding.species]);
    consolidatedLanded.source = landedWeightBySpecies ? landedWeightBySpecies.source : getLandingSource(landingSource);
  }
}

export const voidConsolidateLandings = async (documentNumber: string) => {

  const catchCertificate: CatchCertificate = await getCatchCertificate(documentNumber, DocumentStatuses.Void);
  if (!catchCertificate) {
    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][VOID][DOCUMENT-NOT-FOUND]`);
    return;
  }

  const consolidateLandingsToUpdate: IConsolidateLanding[] = await getConsolidationLandingsByDocumentNumber(documentNumber);
  logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][VOID][CONSOLIDATED-LANDINGS][${consolidateLandingsToUpdate.length}]`);

  for (const consolidateLandingToUpdate of consolidateLandingsToUpdate) {
    logger.info(`[LANDING-CONSOLIDATION][DOCUMENT][${documentNumber}][VOID][NUMBER-OF-LANDING-ON-CC-WITH-RSS-NUMBER][${consolidateLandingToUpdate.rssNumber}-${consolidateLandingToUpdate.dateLanded}]`);

    consolidateLandingToUpdate.items.forEach((item: IConsolidateLandingItem) => {
      item.landings = item.landings.reduce((acc: ICatchCertificateLanding[], cur: ICatchCertificateLanding) => cur.documentNumber !== documentNumber ? [...acc, cur] : acc, []);
      item.exportWeight = item.landings.reduce((acc: number, l: ICatchCertificateLanding) => acc + l.weight, 0);
      item.isOverusedAllCerts = isOverusedAllCerts(item);
      item.isWithinDeminimus = item.isWithinDeminimus && item.landings.some((l: ICatchCertificateLanding) => l.weight <= TOLERANCE_IN_KG);
    });

    await updateConsolidateLanding(consolidateLandingToUpdate)
      .catch(e => logger.error(`[LANDINGS-CONSOLIDATION][VOID-LANDINGS][ERROR][${e}]`));
  }

};

export const findAllCatchCertificates = async (landings: ILanding[]): Promise<CatchCertificate[]> => {
  let allCatchCertificates: CatchCertificate[] = [];

  for (const landing of landings) {
    const rssNumber = landing.rssNumber;
    const dateLanded = moment.utc(landing.dateTimeLanded).format('YYYY-MM-DD');

    logger.info(`[LANDINGS-CONSOLIDATION][FINDING-USAGES-FOR][${rssNumber}-${dateLanded}]`);

    const landingDetail: ILandingDetail | undefined = getPlnsForLanding({ rssNumber, dateLanded });

    logger.info(`[LANDINGS-CONSOLIDATION][FOUND-PLN][${landingDetail.rssNumber}-${landingDetail.dateLanded}][PLN: ${landingDetail.pln}]`);

    const affectedCatchCerts: CatchCertificate[] = await getCatchCertificates({ pln: landingDetail.pln, dateLanded: landingDetail.dateLanded });
    allCatchCertificates = allCatchCertificates.concat(affectedCatchCerts);
    logger.info(`[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][${rssNumber}-${dateLanded}][${affectedCatchCerts.length}]`);
  }

  return allCatchCertificates;
};

export const getLandingsRefresh = async (): Promise<ILandingDetail[]> => {
  return await getRetrospectiveConsolidatedLandings();
};
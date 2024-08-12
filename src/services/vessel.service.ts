import mingo from 'mingo';
import moment from 'moment';
import { IVessel } from 'mmo-shared-reference-data';
import { getVesselsData, getVesselsIdx } from '../data/cache';
import { ILandingDetail } from '../types';
import logger from '../logger';

export function getPlnsForLanding(landing: ILandingDetail): ILandingDetail | undefined {
  const landedDate = moment.utc(landing.dateLanded);
  const landedDateISO = landedDate.toISOString();

  const qry = new mingo.Query({
    rssNumber: { $eq: landing.rssNumber },
    fishingLicenceValidTo: { "$gte" : landedDateISO.substring(0, landedDateISO.length - 5) },
    fishingLicenceValidFrom: { "$lte" : landedDateISO.substring(0, landedDateISO.length - 5) }
  });

  const res = qry.find(getVesselsData()).next() as IVessel;

  if (res) {
    return {
      rssNumber: landing.rssNumber,
      dateLanded: moment.utc(landing.dateLanded).format('YYYY-MM-DD'),
      pln: res.registrationNumber
    };
  }
}

const _vesselLookup = (pln: string, date: string): any => {

  const vesselsIdx = getVesselsIdx()

  const licences: any = vesselsIdx(pln)

  if (!licences) {
    logger.error(`[LANDINGS-CONSOLIDATION][VESSEL-SERVICE][VESSEL-LOOKUP][NOT-FOUND][${pln}:${date}]`)
    return undefined
  }

  for (const licence of licences) {
    if (licence.validFrom <= date && date <= licence.validTo) {
      return {
        rssNumber: licence.rssNumber,
        da: licence.da
      }
    }
  }
}

export const getRssNumber = (pln: string, date: string): string | undefined => {
  const license = _vesselLookup(pln, date);

  if (!license) {
    logger.error(`[LANDINGS-CONSOLIDATION][VESSEL-SERVICE][RSS-NUMBER][NOT-FOUND][${pln}:${date}]`)
  }

  return license ? license.rssNumber : undefined;
}
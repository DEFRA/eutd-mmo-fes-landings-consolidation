import moment from 'moment';
import { ILanding, ILandingQuery } from 'mmo-shared-reference-data';
import { LandingModel } from '../../types'
import logger from '../../logger';

export const getLandings = async (startDate: string, endDate: string): Promise<ILanding[]> => {
  const query = {
    dateTimeLanded: {
      $gte: moment.utc(startDate).startOf('day').toDate(),
      $lte: moment.utc(endDate).endOf('day').toDate()
    }
  };

  logger.info(`[LANDINGS-CONSOLIDATION][QUERY][${JSON.stringify(query)}]`);

  return await LandingModel.find(query).lean();
}

// FI0-11132: batch all landing queries into a single $or query instead of N+1 sequential queries
export const getLandingsMultiple = async (landings: ILandingQuery[]): Promise<ILanding[]> => {

  logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][LENGTH][${landings.length}]`);

  if (landings.length === 0) return []

  const conditions = landings.map(landing => {
    const theDay = moment.utc(landing.dateLanded);

    logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][LANDING][RSS-NUMBER][${landing.rssNumber}]`);

    return {
      rssNumber: landing.rssNumber,
      dateTimeLanded: {
        $gte: theDay.clone().startOf('day').toDate(),
        $lte: theDay.clone().endOf('day').toDate()
      }
    };
  });

  logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][QUERY][BATCHED-${conditions.length}-CONDITIONS]`);

  const landingsMultiple: ILanding[] = await LandingModel.find({ $or: conditions }).lean();

  logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][RESULTS][${landingsMultiple.length}]`);

  // FI0-11132: O(n) dedup using composite key instead of O(n²) isEqual deep comparison
  const seen = new Map<string, ILanding>();
  for (const landing of landingsMultiple) {
    const key = `${landing.rssNumber}|${landing.dateTimeLanded}|${JSON.stringify(landing.items)}`;
    if (!seen.has(key)) {
      seen.set(key, landing);
    }
  }

  return [...seen.values()];
}
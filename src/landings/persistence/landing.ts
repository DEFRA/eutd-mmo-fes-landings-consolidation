import moment from 'moment';
import { isEqual } from 'lodash';
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

export const getLandingsMultiple = async (landings: ILandingQuery[]): Promise<ILanding[]> => {

  logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][LENGTH][${landings.length}]`);

  if (landings.length === 0) return []

  const landingsMultiple:ILanding[] = [];

  for (const landing of landings) {

    const theDay = moment.utc(landing.dateLanded);

    logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][LANDING][RSS-NUMBER][${landing.rssNumber}]`);

    const query = {
      rssNumber: landing.rssNumber,
      dateTimeLanded: {
        $gte: theDay.startOf('day').toDate(),
        $lte: theDay.endOf('day').toDate()
      }
    }

    logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][QUERY][${JSON.stringify(query)}]`);

    const landings = await LandingModel.find(query).lean();

    logger.info(`[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][LANDING-FROM-MONGO][${JSON.stringify(landings)}]`);

    landingsMultiple.push(...landings);
  }

  return landingsMultiple.reduce((ls: ILanding[], landing: ILanding) =>
    ls.some((l: ILanding) => isEqual(l, landing)) ? ls : [...ls, landing], []);
}
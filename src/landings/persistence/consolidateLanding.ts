import moment from "moment";
import { ILandingQuery } from "mmo-shared-reference-data";
import {
  ConsolidateLandingModel,
  IConsolidateLanding,
  IConsolidateLandingItem,
  ILandingDetail
} from "../../types";
import { FilterQuery } from "mongoose";
import { isWithinRetrospectivePeriod } from "../query/isWithinRetrospectivePeriod";
import logger from "../../logger";

export const getConsolidationLandings = async (): Promise<IConsolidateLanding[]> => {
  const results: IConsolidateLanding[] = await ConsolidateLandingModel.find({})
    .select(['-_id', '-__v', '-items._id', '-items.landings._id'])
    .lean();

  return results.map((c: IConsolidateLanding) => ({
    ...c,
    dateLanded: moment.utc(c.dateLanded).format('YYYY-MM-DD'),
  }));
}

export const getConsolidationLanding = async (landing: ILandingQuery): Promise<IConsolidateLanding> => {
  const result: IConsolidateLanding = await ConsolidateLandingModel.findOne({
    rssNumber: landing.rssNumber,
    dateLanded: landing.dateLanded
  }).select(['-_id', '-__v', '-items._id', '-items.landings._id']).lean();

  if (!result) {
    return null;
  }

  return {
    ...result,
    dateLanded: moment.utc(result.dateLanded).format('YYYY-MM-DD'),
  };
}

export const getConsolidationLandingsByRssNumber = async (landings: ILandingQuery[]): Promise<IConsolidateLanding[]> =>
  await ConsolidateLandingModel.find({
    $or: landings.map(({ rssNumber, dateLanded }) => (
      {
        $and: [{
          rssNumber
        }, {
          dateLanded: moment.utc(dateLanded).format('YYYY-MM-DD')
        }]
      }
    ))
  })
    .select(['-_id', '-__v', '-items._id', '-items.landings._id'])
    .lean();

export const getConsolidationLandingsByDocumentNumber = async (documentNumber: string): Promise<IConsolidateLanding[]> => {
  const query = {};
  query['items.landings.documentNumber'] = documentNumber;

  const results: IConsolidateLanding[] = await ConsolidateLandingModel.find(query)
    .select(['-_id', '-__v', '-items._id', '-items.landings._id'])
    .lean();

  return results.map((c: IConsolidateLanding) => ({
    ...c,
    dateLanded: moment.utc(c.dateLanded).format('YYYY-MM-DD'),
  }));
}

export const clearConsolidateLandings = async (start: string, end: string): Promise<void> => {
  logger.info(`[LANDINGS-CONSOLIDATION][CLEARING-ALL-LANDINGS][START-DATE][${moment(start).utc().toISOString()}][END-DATE][${moment(end).utc().toISOString()}]`);
  await ConsolidateLandingModel.deleteMany({
    dateLanded: {
      $gte: moment(start).utc().toDate(),
      $lte: moment(end).utc().toDate()
    }
  })
};

export const updateConsolidateLanding = async (landing: IConsolidateLanding): Promise<void> => {
  if (!landing) {
    return;
  }

  logger.info(`[LANDINGS-CONSOLIDATION][UPDATING][${landing.rssNumber}-${moment.utc(landing.dateLanded).format('YYYY-MM-DD')}][START]`);

  const isOverusedAllCertsOrWithinDeminimus: () => boolean = () => Array.isArray(landing.items) && landing.items.some((i: IConsolidateLandingItem) => i.isOverusedAllCerts || i.isWithinDeminimus);
  if (isOverusedAllCertsOrWithinDeminimus()) {
    logger.info(`[LANDINGS-CONSOLIDATION][UPDATING][${landing.rssNumber}-${moment.utc(landing.dateLanded).format('YYYY-MM-DD')}][ADDING]`);

    await ConsolidateLandingModel.updateMany(
      {
        rssNumber: landing.rssNumber,
        dateLanded: landing.dateLanded
      },
      landing,
      {
        new: true,
        upsert: true
      }
    )
  } else {
    logger.info(`[LANDINGS-CONSOLIDATION][UPDATING][${landing.rssNumber}-${moment.utc(landing.dateLanded).format('YYYY-MM-DD')}][REMOVING]`);

    await ConsolidateLandingModel.deleteMany({
      rssNumber: landing.rssNumber,
      dateLanded: landing.dateLanded
    })
  }
};

export const getRetrospectiveConsolidatedLandings = async (): Promise<ILandingDetail[]> => {
  const query: FilterQuery<any> = {
    $or: [{ 'items': { $exists: true } }, { 'items.landings': { $exists: true } }]
  }

  query['items'] = {
    $elemMatch: {
      $or: [{ isWithinDeminimus: true }, { isOverusedAllCerts: true }]
    }
  }

  const results: IConsolidateLanding[] = await ConsolidateLandingModel.find(query).select(['-_id', '-__v', '-items._id', '-items.landings._id']).lean();

  const landingRefresh: IConsolidateLanding[] = results.filter((result: IConsolidateLanding) =>
    Array.isArray(result.items) && result.items.some((item: IConsolidateLandingItem) => isWithinRetrospectivePeriod(item.landings)))

  logger.info(`[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][${landingRefresh.length}]`);

  return landingRefresh.map((c: IConsolidateLanding) => ({
    rssNumber: c.rssNumber,
    dateLanded: moment.utc(c.dateLanded).format('YYYY-MM-DD'),
  }));
}
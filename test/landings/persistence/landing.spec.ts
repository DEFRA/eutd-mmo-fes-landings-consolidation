const moment = require('moment');
const mongoose = require('mongoose');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { ILanding, LandingSources } from 'mmo-shared-reference-data';
import { LandingModel } from '../../../src/types/landing';
import { ApplicationConfig } from '../../../src/config';
import * as SUT from '../../../src/landings/persistence/landing';
import logger from '../../../src/logger';

ApplicationConfig.loadEnv({});

const addLandingTestData = async (landing: any) => {
  const model = new LandingModel(landing)
  await model.save()
}

const updateLanding = async (landing: ILanding) => {

  await LandingModel.findOneAndUpdate(
    {
      rssNumber: landing.rssNumber,
      dateTimeLanded: landing.dateTimeLanded
    },
    landing,
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true    // create the dateTimeRetrieved the first time we see this landing
    }
  )

};

const updateLandings = async (landings: ILanding[]) => {

  const isMultipleWithDateOnly = (landings.length > 1) && landings.every(landing =>
      moment.utc(landing.dateTimeLanded).format('HH:mm:ss.SSS ZZ') === '00:00:00.000 +0000')

  for (const [i, landing] of landings.entries()) {

    if (isMultipleWithDateOnly) {

      logger.info(`[LANDINGS][UPDATE-LANDINGS] landings on the same day all at midnight. Adding ${i} milliseconds to create a key`)

      const dateTimeLanded = moment.utc(landing.dateTimeLanded)
      dateTimeLanded.add(i, 'milliseconds')

      landing.dateTimeLanded = dateTimeLanded.toISOString()
    }

    await updateLanding(landing)
      .catch(e => logger.error(`[LANDINGS][UPDATE-LANDINGS][ERROR][${e}]`));

  }

}

describe('MongoMemoryServer - Wrapper to run inMemory Database', () => {
  let mongoServer;
  const opts = { connectTimeoutMS: 60000, socketTimeoutMS: 600000, serverSelectionTimeoutMS: 60000 }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, opts).catch(err => { console.log(err) });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });


  describe('get landings', () => {

    beforeEach(async () => {
      await LandingModel.deleteMany({});
    });

    it('validating the mongoose model is wired up', async () => {
      const model = new LandingModel({
        rssNumber: 'rssNumber',
        dateTimeLanded: moment.utc(),
        source: LandingSources.LandingDeclaration,
        items: [{ species: 'COD', weight: 2, factor: 1 }]
      })
      await model.save()

      const result: any = await LandingModel.findOne()

      expect(result.rssNumber).toBe('rssNumber')
    });

    it('can retrive landings', async () => {
      await addLandingTestData({
        dateTimeLanded: moment.utc('2019-01-01T01:00:00Z'),
        source: LandingSources.LandingDeclaration,
        items: [{ species: 'COD', weight: 2, factor: 1 }]
      })

      const results = await SUT.getLandings('2019-01-01','2020-01-01');
      expect(results.length).toBe(1)
    });

  });

  describe('get multiple landings', () => {

    let mockLoggerInfo: jest.SpyInstance;
  
    beforeEach(async () => {
      await LandingModel.deleteMany({});
    });
  
    it('can get multiple landings', async() => {
      mockLoggerInfo = jest.spyOn(logger, 'info');
  
      const landings: ILanding[] = [
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-07-01T00:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 2, factor: 1 } ]
        },
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-07-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        }
      ]
  
      await updateLandings(landings)
  
      const res = await SUT.getLandingsMultiple( [{ rssNumber: '100', dateLanded: '2019-07-01' }] )
  
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][LENGTH][1]');
  
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-MULTIPLE-LANDINGS][LANDING][RSS-NUMBER][100]');
  
      expect(res.length).toBe(2)
    })
  
    it('will match correctly on both attributes', async() => {
  
      const landings: ILanding[] = [
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-07-01T00:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 2, factor: 1 } ]
        },
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        },
        {
          rssNumber: '200',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        }
      ]
  
      await updateLandings(landings)
  
      const res = await SUT.getLandingsMultiple( [{ rssNumber: '100', dateLanded: '2019-08-01' }] )
  
      expect(res.length).toBe(1)
  
    })
  
    it('can fetch multiple', async() => {
  
      const landings: ILanding[] = [
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-07-01T00:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 2, factor: 1 } ]
        },
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        },
        {
          rssNumber: '200',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        }
      ]
  
      await updateLandings(landings)
  
      const res = await SUT.getLandingsMultiple( [
        { rssNumber: '100', dateLanded: '2019-08-01' },
        { rssNumber: '200', dateLanded: '2019-08-01' },
      ] )
  
      expect(res.length).toBe(2)
  
    })
  
    it('will behave correctly on duplicate input', async() => {
  
      const landings: ILanding[] = [
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-07-01T00:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 2, factor: 1 } ]
        },
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        },
        {
          rssNumber: '200',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        }
      ]
  
      await updateLandings(landings)
  
      const res = await SUT.getLandingsMultiple( [
        { rssNumber: '100', dateLanded: '2019-08-01' },
        { rssNumber: '100', dateLanded: '2019-08-01' },
      ] )
  
      expect(res.length).toBe(1)
  
    })
  
    it('can handle empty input', async() => {
  
      const landings: ILanding[] = [
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-07-01T00:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 2, factor: 1 } ]
        },
        {
          rssNumber: '100',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        },
        {
          rssNumber: '200',
          dateTimeLanded: moment.utc('2019-08-01T10:00:00Z').toISOString(),
          source: LandingSources.LandingDeclaration,
          items: [ { species: 'COD', weight: 4, factor: 1 } ]
        }
      ]
  
      await updateLandings(landings)
  
      const res = await SUT.getLandingsMultiple( [] )
  
      expect(res.length).toBe(0)
  
    });
  
  });
});
const mongoose = require('mongoose');

import { MongoMemoryServer } from 'mongodb-memory-server';
import { LandingSources } from 'mmo-shared-reference-data';
import { CatchCertificateModel, ConsolidateLandingModel, IConsolidateLanding } from '../../../src/types';
import * as SUT from '../../../src/landings/persistence/consolidateLanding';
import * as VesselService from '../../../src/services/vessel.service';
import logger from '../../../src/logger';
import moment from 'moment';

const buildLandingsConsolidateLandingsCollection = async () => {
  let consolidatedLanded = new ConsolidateLandingModel({
    dateLanded: "2020-01-09",
    rssNumber: "rssWA1",
    source: LandingSources.LandingDeclaration,
    items: [{
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 260,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 260,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    },{
      species: "COD",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 100,
      landings: [{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 100,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }]
  })
  
  await consolidatedLanded.save();

  consolidatedLanded = new ConsolidateLandingModel({
    dateLanded: "2020-10-09",
    rssNumber: "rssWA1",
    source: LandingSources.LandingDeclaration,
    items: [{
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 260,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 260,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    },{
      species: "COD",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 100,
      landings: [{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 100,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }]
  })
  
  await consolidatedLanded.save();

  consolidatedLanded = new ConsolidateLandingModel({
    dateLanded: "2024-01-01",
    rssNumber: "rssWA1",
    source: LandingSources.LandingDeclaration,
    items: [{
      species: "HER",
      landedWeight: 1000,
      isEstimate: false,
      exportWeight: 260,
      landings: [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        weight: 260,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    },{
      species: "COD",
      landedWeight: 100,
      isEstimate: false,
      exportWeight: 100,
      landings: [{
        landingId: "CC2-1",
        documentNumber: "CC2",
        weight: 100,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }]
  })
  
  await consolidatedLanded.save();
};

describe('MongoMemoryServer - Wrapper to run inMemory Database', () => {
  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;
  let mockUpdateMany: jest.SpyInstance;
  let mockDeleteMany: jest.SpyInstance;
  let mockVesselService: jest.SpyInstance;
  let mongoServer: MongoMemoryServer;
  const opts = { connectTimeoutMS: 60000, socketTimeoutMS: 600000, serverSelectionTimeoutMS: 60000 }

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, opts).catch((err: Error) => { console.log(err) });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
    mockUpdateMany = jest.spyOn(ConsolidateLandingModel, 'updateMany');
    mockDeleteMany= jest.spyOn(ConsolidateLandingModel, 'deleteMany');
    mockVesselService = jest.spyOn(VesselService, 'getPlnsForLanding');
    mockVesselService.mockReturnValue({ pln: 'WA1', rssNumber: 'rssWA1', dateLanded: '2023-10-09' });
    await CatchCertificateModel.deleteMany({});
    await ConsolidateLandingModel.deleteMany({});
  });

  afterEach(() => {
    mockVesselService.mockRestore();
    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
    mockUpdateMany.mockRestore();
    mockDeleteMany.mockRestore();
  });

  describe('getConsolidationLandings', () => {

    it('will get a single consolidated landing within the landings consolidation collection', async () => {
      await buildLandingsConsolidateLandingsCollection();
  
      const result: IConsolidateLanding = await SUT.getConsolidationLanding({ rssNumber: 'rssWA1', dateLanded: '2020-01-09' });
      expect(result.rssNumber).toBe('rssWA1');
      expect(result.dateLanded).toBe('2020-01-09');
    });
  
    it('will null if a consolidated landing can not be found', async () => {
      await buildLandingsConsolidateLandingsCollection();
  
      const result: IConsolidateLanding = await SUT.getConsolidationLanding({ rssNumber: 'rssWA5', dateLanded: '2020-01-10' });
      expect(result).toBeNull();
    });
  
    it('will get all consolidated landings within the landings consolidation collection', async () => {
      await buildLandingsConsolidateLandingsCollection();
  
      const expected: IConsolidateLanding[] = [{
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 1000,
          isEstimate: false,
          exportWeight: 260,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 260,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        },{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          landings: [{
            landingId: "CC2-1",
            documentNumber: "CC2",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        }]
      },{
        dateLanded: "2020-10-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 1000,
          isEstimate: false,
          exportWeight: 260,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 260,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        },{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          landings: [{
            landingId: "CC2-1",
            documentNumber: "CC2",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        }]
      },{
        dateLanded: "2024-01-01",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 1000,
          isEstimate: false,
          exportWeight: 260,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 260,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        },{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          landings: [{
            landingId: "CC2-1",
            documentNumber: "CC2",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        }]
      }];
  
      const results: IConsolidateLanding[] = await SUT.getConsolidationLandings();
      expect(results).toHaveLength(3);
      expect(results).toStrictEqual(expected);
    });

  });

  describe('clearConsolidateLandings', () => {
    it('will clear all consolidated landings within the landings consildation collection', async () => {
      await buildLandingsConsolidateLandingsCollection();
  
      expect(await ConsolidateLandingModel.find({})).toHaveLength(3);
  
      await SUT.clearConsolidateLandings('2020-01-01', '2020-12-31');
  
      expect(await ConsolidateLandingModel.find({})).toHaveLength(1);
    });
  });

  describe('getConsolidationLandingsByDocumentNumber', () => {
    it('will get all consolidated landings that contain a landing with a specific document number', async () => {
      let consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 1000,
          isEstimate: false,
          exportWeight: 260,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 260,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        },{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          landings: [{
            landingId: "CC3-1",
            documentNumber: "CC3",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        }]
      })
      
      await consolidatedLanded.save();
    
      consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2024-01-01",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 1000,
          isEstimate: false,
          exportWeight: 260,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 260,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        },{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          landings: [{
            landingId: "CC2-1",
            documentNumber: "CC2",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const expected: IConsolidateLanding[] = [{
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 1000,
          isEstimate: false,
          exportWeight: 260,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 260,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        },{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          landings: [{
            landingId: "CC3-1",
            documentNumber: "CC3",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: "2023-10-13"
          }]
        }]
      }];
  
      const results: IConsolidateLanding[] = await SUT.getConsolidationLandingsByDocumentNumber('CC3');
      expect(results).toHaveLength(1);
      expect(results).toStrictEqual(expected);
    });
  
    it('will return no consolidated landings if not matching document numbers are found', async () => {
      await buildLandingsConsolidateLandingsCollection();
      const results: IConsolidateLanding[] = await SUT.getConsolidationLandingsByDocumentNumber('CC3');
      expect(results).toHaveLength(0);
      expect(results).toStrictEqual([]);
    });
  });

  describe('getRetrospectiveConsolidateLandings', () => {
    it('will return a single consolidated landing for the nightly job', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][1]');
      expect(results).toHaveLength(1);
      expect(results[0]).toStrictEqual({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1"
      })
    });
  
    it('will return a single consolidated landing for the nightly job for multiple species', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        },{
          species: "ANF",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-2",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][1]');
      expect(results).toHaveLength(1);
    });
  
    it('will return a single consolidated landing for the nightly job on the expected landing date', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: moment.utc().format('YYYY-MM-DD'),
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][1]');
      expect(results).toHaveLength(1);
      expect(results[0]).toStrictEqual({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1"
      })
    });
  
    it('will return a single consolidated landing for the nightly job on the landing end date', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: moment.utc().subtract(1, 'day').format('YYYY-MM-DD'),
            landingDataEndDate: moment.utc().format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][1]');
      expect(results).toHaveLength(1);
      expect(results[0]).toStrictEqual({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1"
      })
    });
  
    it('will return a single consolidated landing for the nightly job on the day after the landing end date', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: moment.utc().subtract(1, 'day').format('YYYY-MM-DD'),
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][1]');
      expect(results).toHaveLength(1);
      expect(results[0]).toStrictEqual({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1"
      })
    });
  
    it('will return a single consolidated landings for the nightly job for multiple landings with only on in retrospective period', async () => {
      const consolidatedLanded_COD = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded_COD.save();
  
      const consolidatedLanded_HER = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA2",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().subtract(2, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded_HER.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][1]');
      expect(results).toHaveLength(1);
    });
  
    it('will return multiple consolidated landings for the nightly job for multiple landings', async () => {
      const consolidatedLanded_COD = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded_COD.save();
  
      const consolidatedLanded_HER = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA2",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "HER",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded_HER.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][2]');
      expect(results).toHaveLength(2);
    });
  
    it('will return a single consolidated landing for the nightly job where a Elog species failure within deminus has occurred', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: false,
          isWithinDeminimus: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][1]');
      expect(results).toHaveLength(1);
    });
  
    it('will not return consolidated landing for the nightly job without landing end or expected dates', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][0]');
      expect(results).toHaveLength(0);
    });
  
    it('will not return a single consolidated landing for the nightly job where an overuse hasn\'t occurred', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: false,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][0]');
      expect(results).toHaveLength(0);
    });
  
    it('will not return a single consolidated landing for the nightly job before retro period', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: moment.utc().add(1, 'day').format('YYYY-MM-DD'),
            landingDataEndDate: moment.utc().add(2, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][0]');
      expect(results).toHaveLength(0);
    });
  
    it('will not return a single consolidated landing for the nightly job for an out of retro period landing', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-10",
            landingDataEndDate: "2023-10-11"
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const results = await SUT.getRetrospectiveConsolidatedLandings();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][GET-RETROSPECTIVE-LANDINGS][0]');
      expect(results).toHaveLength(0);
    });
  });

  describe('updateConsolidateLanding', () => {

    beforeEach(() => {
      jest.restoreAllMocks();
    });
    
    it('will update consolidation landing collection if an overuse has occured', async () => {
      const consolidatedLanding: IConsolidateLanding = {
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      }
  
      await SUT.updateConsolidateLanding(consolidatedLanding);
  
      const results = await SUT.getConsolidationLandings();
      expect(results).toHaveLength(1);
    });
  
    it('will remove consolidation landing collection if an overuse has not occured', async () => {
      const consolidatedLanded = new ConsolidateLandingModel({
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: true,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      })
      
      await consolidatedLanded.save();
  
      const consolidatedLanding: IConsolidateLanding = {
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: [{
          species: "COD",
          landedWeight: 100,
          isEstimate: false,
          exportWeight: 100,
          isOverusedAllCerts: false,
          landings: [{
            landingId: "CC1-1",
            documentNumber: "CC1",
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().add(1, 'day').format('YYYY-MM-DD')
          }]
        }]
      }
  
      await SUT.updateConsolidateLanding(consolidatedLanding);
  
      const results = await SUT.getConsolidationLandings();
      expect(results).toHaveLength(0);
    });

    it('will handle an undefined consolidated landing', async () => {
      mockDeleteMany.mockRestore();
      
      await SUT.updateConsolidateLanding(undefined);
  
      const results = await SUT.getConsolidationLandings();
      expect(results).toHaveLength(0);
      expect(mockUpdateMany).toHaveBeenCalledTimes(0);
      expect(mockDeleteMany).toHaveBeenCalledTimes(0);
    });

    it('will handle an undefined consolidated landing item', async () => {
      mockDeleteMany.mockRestore();

      const consolidatedLanding: IConsolidateLanding = {
        dateLanded: "2020-01-09",
        rssNumber: "rssWA1",
        source: LandingSources.LandingDeclaration,
        items: []
      }

      await SUT.updateConsolidateLanding(consolidatedLanding);
  
      const results = await SUT.getConsolidationLandings();
      expect(results).toHaveLength(0);
      expect(mockUpdateMany).toHaveBeenCalledTimes(0); 
      expect(mockDeleteMany).toHaveBeenCalledTimes(0);
    });
  });

  describe('getConsolidationLandingsByRssNumber', () => {
    it('will return consolidated landings by rssNumber', async () => {
      await buildLandingsConsolidateLandingsCollection();
  
      const result: IConsolidateLanding[] = await SUT.getConsolidationLandingsByRssNumber([{ rssNumber: 'rssWA1', dateLanded: '2020-01-09' }]);
      expect(result).toHaveLength(1);
    })
  });

});
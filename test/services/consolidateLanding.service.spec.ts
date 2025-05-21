import mongoose from 'mongoose';
import * as Landings from '../../src/landings/persistence/landing';
import * as Transformations from '../../src/landings/transformations/landing';
import * as ConsolidateLandings from '../../src/landings/persistence/consolidateLanding';
import * as Cache from '../../src/data/cache';
import * as Risking from '../../src/data/risking';
import { runLandingsConsolidationJob, consolidateLandings, updateConsolidateLandings, voidConsolidateLandings, getLandingsRefresh, findAllCatchCertificates } from '../../src/services/consolidateLanding.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { CatchCertificateModel, ConsolidateLandingModel, IConsolidateLanding, LandingModel, PreApprovedDocumentModel } from '../../src/types';
import { ILanding, LandingSources, generateIndex } from 'mmo-shared-reference-data';
import logger from '../../src/logger';
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
        landingDataEndDate: moment.utc().format('YYYY-MM-DD')
      }]
    }, {
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
        landingDataEndDate: moment.utc().format('YYYY-MM-DD')
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
        landingDataEndDate: moment.utc().format('YYYY-MM-DD')
      }]
    }, {
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
        landingDataEndDate: moment.utc().format('YYYY-MM-DD')
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
        landingDataEndDate: moment.utc().format('YYYY-MM-DD')
      }]
    }, {
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
        landingDataEndDate: moment.utc().format('YYYY-MM-DD')
      }]
    }]
  })

  await consolidatedLanded.save();
};

const buildDocumentUsageCertificatesCollection = async () => {
  let catchCert = new CatchCertificateModel({
    status: "COMPLETE",
    __t: "catchCert",
    documentNumber: "CC1",
    createdAt: "2019-07-10T08:26:06.939Z",
    createdBy: "Bob",
    createdByEmail: "foo@foo.com",
    exportData: {
      products: [
        {
          speciesId: "CC1-1-HER",
          speciesCode: "HER",
          state: {
            code: "FRE",
            name: "Fresh"
          },
          presentation: {
            code: "FIS",
            name: "Filleted and skinned"
          },
          factor: 2.6,
          caughtBy: [
            {
              id: "CC1-1",
              vessel: "DAYBREAK",
              pln: "WA1",
              date: "2023-10-09",
              weight: 1000,
              dataEverExpected: true,
              landingDataExpectedDate: "2023-10-11",
              landingDataEndDate: moment.utc().format('YYYY-MM-DD')
            }
          ]
        }, {
          speciesId: "CC1-2-COD",
          speciesCode: "COD",
          state: {
            code: "FRE",
            name: "Fresh"
          },
          presentation: {
            code: "FIS",
            name: "Filleted and skinned"
          },
          factor: 2.6,
          caughtBy: [
            {
              id: "CC1-2",
              vessel: "DAYBREAK",
              pln: "WA2",
              date: "2023-10-09",
              weight: 1000,
              dataEverExpected: true,
              landingDataExpectedDate: "2023-10-11",
              landingDataEndDate: moment.utc().format('YYYY-MM-DD')
            }
          ]
        }
      ]
    }
  });

  await catchCert.save();

  catchCert = new CatchCertificateModel({
    status: "COMPLETE",
    __t: "catchCert",
    documentNumber: "CC2",
    createdAt: "2019-07-10T08:26:06.939Z",
    createdBy: "Bob",
    createdByEmail: "foo@foo.com",
    exportData: {
      products: [
        {
          speciesId: "CC2-1-HER",
          speciesCode: "HER",
          state: {
            code: "FRE",
            name: "Fresh"
          },
          presentation: {
            code: "FIS",
            name: "Filleted and skinned"
          },
          factor: 2.6,
          caughtBy: [
            {
              id: "CC2-1",
              vessel: "DAYBREAK",
              pln: "WA1",
              date: "2023-10-09",
              weight: 1000,
              dataEverExpected: true,
              landingDataExpectedDate: "2023-10-11",
              landingDataEndDate: moment.utc().format('YYYY-MM-DD')
            }
          ]
        }, {
          speciesId: "CC2-2-COD",
          speciesCode: "COD",
          state: {
            code: "FRE",
            name: "Fresh"
          },
          presentation: {
            code: "FIS",
            name: "Filleted and skinned"
          },
          factor: 2.6,
          caughtBy: [
            {
              id: "CC2-2",
              vessel: "DAYBREAK",
              pln: "WA2",
              date: "2023-10-09",
              weight: 1000,
              dataEverExpected: true,
              landingDataExpectedDate: "2023-10-11",
              landingDataEndDate: moment.utc().format('YYYY-MM-DD')
            }
          ]
        }
      ]
    }
  });

  await catchCert.save();
}

describe('consolidate landing service - runLandingsConsolidationJob', () => {
  let mockClearLandings: jest.SpyInstance;
  let mockGetLandings: jest.SpyInstance;
  let mockTransformedLandings: jest.SpyInstance;
  let mockGetVesselData: jest.SpyInstance;
  let mockGetSpeciesAliases: jest.SpyInstance;
  let mockRefreshRiskingData: jest.SpyInstance;
  let mockLoggerInfo: jest.SpyInstance;

  beforeEach(() => {
    mockClearLandings = jest.spyOn(ConsolidateLandings, 'clearConsolidateLandings');
    mockClearLandings.mockResolvedValue(undefined);
    mockGetLandings = jest.spyOn(Landings, 'getLandings');
    mockGetLandings.mockResolvedValue([]);
    mockTransformedLandings = jest.spyOn(Transformations, 'transformLandings');
    mockGetVesselData = jest.spyOn(Cache, 'getVesselsData');
    mockGetVesselData.mockReturnValue([]);
    mockGetSpeciesAliases = jest.spyOn(Cache, 'getSpeciesAliases');
    mockGetSpeciesAliases.mockReturnValue({});
    mockRefreshRiskingData = jest.spyOn(Cache, 'refreshRiskingData');
    mockRefreshRiskingData.mockResolvedValue(undefined);
    mockLoggerInfo = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    mockClearLandings.mockRestore();
    mockGetLandings.mockRestore();
    mockTransformedLandings.mockRestore();
    mockGetVesselData.mockRestore();
    mockGetSpeciesAliases.mockRestore();
    mockRefreshRiskingData.mockRestore();
    mockLoggerInfo.mockRestore();
  });

  it('will run the landings consolidation job with start and end dates', async () => {
    await runLandingsConsolidationJob('2023-10-09', '2023-10-10');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[LANDINGS-CONSOLIDATION][START-DATE][2023-10-09][END-DATE][2023-10-10]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[LANDINGS-CONSOLIDATION][LANDINGS][0]');
    expect(mockClearLandings).toHaveBeenCalledWith('2023-10-09', '2023-10-10');
    expect(mockGetLandings).toHaveBeenCalledWith('2023-10-09', '2023-10-10');
    expect(mockTransformedLandings).toHaveBeenCalled();
  });
});

describe('MongoMemoryServer - Wrapper to run inMemory Database', () => {
  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;
  let mockUpdateMany: jest.SpyInstance;
  let mockDeleteMany: jest.SpyInstance;
  let mockVesselIdx: jest.SpyInstance;
  let mockGetVesselData: jest.SpyInstance;
  let mockGetSpeciesAliases: jest.SpyInstance;
  let mockRefreshRiskingData: jest.SpyInstance;
  let mockGetIsHighRisk: jest.SpyInstance;
  let mongoServer: MongoMemoryServer;
  const opts = { connectTimeoutMS: 60000, socketTimeoutMS: 600000, serverSelectionTimeoutMS: 60000 };
  const vesselData = [{
    registrationNumber: "WA1",
    fishingLicenceValidTo: "2024-12-20T00:00:00",
    fishingLicenceValidFrom: "2010-12-29T00:00:00",
    rssNumber: "rssWA1",
    cfr: "cfr",
    vesselLength: 10.75
  },
  {
    registrationNumber: "WA2",
    fishingLicenceValidTo: "2024-12-20T00:00:00",
    fishingLicenceValidFrom: "2010-12-29T00:00:00",
    rssNumber: "rssWA2",
    cfr: "cfr",
    vesselLength: 10.75
  }];

  const speciesAliases = {
    MON: ['ANF'],
    ANF: ['MON']
  };

  const vesselsIdx = generateIndex(vesselData);

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
    mockDeleteMany = jest.spyOn(ConsolidateLandingModel, 'deleteMany');
    mockVesselIdx = jest.spyOn(Cache, 'getVesselsIdx');
    mockVesselIdx.mockReturnValue(vesselsIdx);
    mockGetVesselData = jest.spyOn(Cache, 'getVesselsData');
    mockGetVesselData.mockReturnValue(vesselData);
    mockGetSpeciesAliases = jest.spyOn(Cache, 'getSpeciesAliases');
    mockGetSpeciesAliases.mockImplementation((speciesName: string) => {
      return speciesAliases[speciesName] ?? []
    });
    mockRefreshRiskingData = jest.spyOn(Cache, 'refreshRiskingData');
    mockRefreshRiskingData.mockResolvedValue(undefined);
    mockGetIsHighRisk = jest.spyOn(Risking, 'isHighRisk');
    mockGetIsHighRisk.mockReturnValue(true);
    await CatchCertificateModel.deleteMany({});
    await ConsolidateLandingModel.deleteMany({});
    await PreApprovedDocumentModel.deleteMany({});
    await LandingModel.deleteMany({});
  });

  afterEach(() => {
    mockVesselIdx.mockRestore();
    mockGetVesselData.mockRestore();
    mockGetSpeciesAliases.mockRestore();
    mockRefreshRiskingData.mockRestore();
    mockGetIsHighRisk.mockRestore();
    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
    mockUpdateMany.mockRestore();
    mockDeleteMany.mockRestore();
  });

  it('will run the landings consolidation job with start and end dates for pre-existing elog withinDeminmus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-25"
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2023-06-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 5, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2023-06-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: true,
        isWithinDeminimus: true,
        exportWeight: 50,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: "2023-10-25"
        }]
      }]
    });

    await consolidatedLanded.save();

    await runLandingsConsolidationJob('2023-01-01', '2023-12-31');

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will run the landings consolidation job with start and end dates for pre-existing elog withinDeminmus and retain entry', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2023-06-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 5, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2023-06-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: true,
        isWithinDeminimus: true,
        exportWeight: 50,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    });

    await consolidatedLanded.save();

    await runLandingsConsolidationJob('2023-01-01', '2023-12-31');

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1);
  });

  it('will run the landings consolidation job with start and end dates for elog withinDeminmus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-25"
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const catchCert_2 = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-25"
              }
            ]
          }
        ]
      }
    });

    await catchCert_2.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2023-06-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 5, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2023-06-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: true,
        isWithinDeminimus: true,
        exportWeight: 50,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: "2023-10-25"
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: "2023-10-25"
        }]
      }]
    });

    await consolidatedLanded.save();

    await runLandingsConsolidationJob('2023-01-01', '2023-12-31');

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will run the landings consolidation job with start and end dates for elog withinDeminmus and retain entry', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-25"
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const catchCert_2 = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert_2.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2023-06-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 5, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2023-06-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: true,
        isWithinDeminimus: true,
        exportWeight: 50,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: "2023-10-25"
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    });

    await consolidatedLanded.save();

    await runLandingsConsolidationJob('2023-01-01', '2023-12-31');

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1);
  });

  it('will run the landings consolidation job with start and end dates for elog withinDeminmus and retain all entries', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const catchCert_2 = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-06-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert_2.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2023-06-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 5, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2023-06-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: true,
        isWithinDeminimus: true,
        exportWeight: 50,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    });

    await consolidatedLanded.save();

    await runLandingsConsolidationJob('2023-01-01', '2023-12-31');

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1);
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
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }, {
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
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }, {
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
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }, {
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
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }, {
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
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }, {
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
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }];

    const results: IConsolidateLanding[] = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toHaveLength(3);
    expect(results).toStrictEqual(expected);
  });

  it('will clear all consolidated landings within the landings consildation collection', async () => {
    await buildLandingsConsolidateLandingsCollection();

    expect(await ConsolidateLandingModel.find({})).toHaveLength(3);

    await ConsolidateLandings.clearConsolidateLandings('2020-01-01', '2020-12-31');

    expect(await ConsolidateLandingModel.find({})).toHaveLength(1);
  });

  it('will update the landings consolidate landings collection', async () => {
    await buildDocumentUsageCertificatesCollection();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }, {
      dateLanded: "2023-10-09",
      rssNumber: "rssWA2",
      source: LandingSources.CatchRecording,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(2);
    expect(mockRefreshRiskingData).toHaveBeenCalled();
  });

  it('will update the landings consolidate landings collection even when an error occurs refreshing risking data', async () => {
    mockRefreshRiskingData.mockRejectedValue(new Error('something went wrong'));
    await buildDocumentUsageCertificatesCollection();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }, {
      dateLanded: "2023-10-09",
      rssNumber: "rssWA2",
      source: LandingSources.CatchRecording,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(2);
    expect(mockRefreshRiskingData).toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][REFRESH-RISKING-DATA][ERROR][Error: something went wrong]')
  });

  it('will update the landings consolidate landings collection with entry for elog species failure within the deminimus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1);
    expect(results[0].items).toHaveLength(1);
    expect(results[0].items[0].species).toBe('COD');
    expect(results[0].items[0].isWithinDeminimus).toBe(true);
    expect(results[0].items[0].exportWeight).toBe(50);
  });

  it('will update the landings consolidate landings collection with entry with floats', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1.23,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 10.23,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              },
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 10.23,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1);
    expect(results[0].items).toHaveLength(1);
    expect(results[0].items[0].species).toBe('COD');
    expect(results[0].items[0].exportWeight).toBe(25.1658);
  });

  it('will update the landings consolidate landings collection with entry for mutliple elog species failure within the deminimus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          },
          {
            speciesId: "CC1-1-LBE",
            speciesCode: "LBE",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1)
    expect(results[0].items).toHaveLength(2);
    expect(results[0].items[0].species).toBe('COD');
    expect(results[0].items[1].species).toBe('LBE');
    expect(results[0].items[0].isWithinDeminimus).toBe(true);
    expect(results[0].items[1].isWithinDeminimus).toBe(true);
  });

  it('will update the landings consolidate landings collection with entry for mutliple elog species failure using the same species within the deminimus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 20,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              },
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 20,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1)
    expect(results[0].items).toHaveLength(1);
    expect(results[0].items[0].species).toBe("COD");
    expect(results[0].items[0].isWithinDeminimus).toBe(true);
    expect(results[0].items[0].exportWeight).toBe(40);
    expect(results[0].items[0].landings).toHaveLength(2);
  });

  it('will update the landings consolidate landings collection with entry for mutliple elog species failure using the same species within the deminimus and landing overuse', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 20,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              },
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 20,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const catchCert_HER_1 = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert_HER_1.save();

    const catchCert_HER_2 = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC3",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC3-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC3-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert_HER_2.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1)
    expect(results[0].items).toHaveLength(2);

    expect(results[0].items[0].species).toBe("HER");
    expect(results[0].items[0].isOverusedAllCerts).toBe(true)
    expect(results[0].items[0].isWithinDeminimus).toBeUndefined();
    expect(results[0].items[0].exportWeight).toBe(200);
    expect(results[0].items[0].landings).toHaveLength(2);

    expect(results[0].items[1].species).toBe("COD");
    expect(results[0].items[1].isOverusedAllCerts).toBeUndefined();
    expect(results[0].items[1].isWithinDeminimus).toBe(true);
    expect(results[0].items[1].exportWeight).toBe(40);
    expect(results[0].items[1].landings).toHaveLength(2);
  });

  it('will update the landings consolidate landings collection with entry for mutliple elog species failure using the same species within the deminimus and landing overuse with species alias', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 20,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              },
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 20,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const catchCert_MON_1 = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-MON",
            speciesCode: "MON",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert_MON_1.save();

    const catchCert_MON_2 = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC3",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC3-1-MON",
            speciesCode: "MON",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC3-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert_MON_2.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "ANF",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1)
    expect(results[0].items).toHaveLength(2);

    expect(results[0].items[0].species).toBe("ANF");
    expect(results[0].items[0].isOverusedAllCerts).toBe(true)
    expect(results[0].items[0].isWithinDeminimus).toBeUndefined();
    expect(results[0].items[0].exportWeight).toBe(200);
    expect(results[0].items[0].landings).toHaveLength(2);

    expect(results[0].items[1].species).toBe("COD");
    expect(results[0].items[1].isOverusedAllCerts).toBeUndefined();
    expect(results[0].items[1].isWithinDeminimus).toBe(true);
    expect(results[0].items[1].exportWeight).toBe(40);
    expect(results[0].items[1].landings).toHaveLength(2);
  });

  it('will update the landings consolidate landings collection with entry for mutliple elog species failure using the same species inside the deminimus on each landing line', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 26,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              },
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 25,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(1)
  });

    it('will not update the landings consolidate landings collection with entry for landing declarations with a species within deminimus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 45,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 45,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will not update the landings consolidate landings collection with entry for elog species above the deminimus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 51,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 45,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will not update the landings consolidate landings collection with entry for elog species within the deminimus on catch certificate', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 45,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 45,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will not update the landings consolidate landings collection with entry for elog species failure above the deminimus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 51,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will not update the landings consolidate landings collection with entry for elog where species is found', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 45,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will not update the landings consolidate landings collection with entry for elog where species is found as an alias', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-MON",
            speciesCode: "MON",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 51,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "ANF",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will not update the landings consolidate landings collection with no PLN', async () => {
    mockGetVesselData.mockReturnValue([]);

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandingModel.find({});
    expect(results).toHaveLength(0);
  });

  it('will catch any errors thrown whilst updating', async () => {
    await buildDocumentUsageCertificatesCollection();

    mockUpdateMany.mockRejectedValue(new Error('something has gone wrong'));

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }, {
      dateLanded: "2023-10-09",
      rssNumber: "rssWA2",
      source: LandingSources.CatchRecording,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: true
      }]
    }];

    await consolidateLandings(transformedLandings);
    expect(mockLoggerError).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][UPDATE-LANDINGS][ERROR][Error: something has gone wrong]');
  });

  it('will update the landings consolidate landings collection with document usage only when a document is present', async () => {
    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    const expected: IConsolidateLanding[] = [];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandings.getConsolidationLandings();

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][2023-10-09-WA1][0]');
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-SPECIES-FOUND-ON-CATCH-CERTIFICATES][2023-10-09-WA1][0]');
    expect(results).toStrictEqual(expected);
  });

  it('will update the landings consolidate landings collection with document usage', async () => {
    await buildDocumentUsageCertificatesCollection();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 100,
        isEstimate: false,
        isOverusedAllCerts: true,
        exportWeight: 5200,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          isHighRisk: true,
          isPreApproved: false,
          weight: 2600,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          isHighRisk: true,
          isPreApproved: false,
          weight: 2600,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandings.getConsolidationLandings();

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][2023-10-09-WA1][2]');
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-SPECIES-FOUND-ON-CATCH-CERTIFICATES][2023-10-09-WA1][1]');
    expect(results).toStrictEqual(expected);
  });

  it('will update the landings consolidate landings collection with document usage containing species alias', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-MON",
            speciesCode: "MON",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 2.6,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const catchCert_ANF = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-MON",
            speciesCode: "MON",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 2.6,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert_ANF.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "ANF",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "ANF",
        landedWeight: 100,
        isEstimate: false,
        isOverusedAllCerts: true,
        exportWeight: 520,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          isHighRisk: true,
          isPreApproved: false,
          weight: 260,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          isHighRisk: true,
          isPreApproved: false,
          weight: 260,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandings.getConsolidationLandings();

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][2023-10-09-WA1][2]');
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-SPECIES-FOUND-ON-CATCH-CERTIFICATES][2023-10-09-WA1][1]');
    expect(results).toStrictEqual(expected);
  });

  it('will update the landings consolidate landings collection with mutiple document usages', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          },
          {
            speciesId: "CC1-2-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          },
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 10,
        isEstimate: false
      }, {
        species: "COD",
        landedWeight: 10,
        isEstimate: false
      }]
    }];

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 10,
        isEstimate: false,
        isOverusedAllCerts: true,
        exportWeight: 2000,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          isHighRisk: true,
          weight: 1000,
          dataEverExpected: true,
          isPreApproved: false,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          isHighRisk: true,
          weight: 1000,
          dataEverExpected: true,
          isPreApproved: false,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }, {
        species: "COD",
        landedWeight: 10,
        isEstimate: false,
        isOverusedAllCerts: true,
        exportWeight: 2000,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          isHighRisk: true,
          isPreApproved: false,
          weight: 1000,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          isHighRisk: true,
          isPreApproved: false,
          weight: 1000,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandings.getConsolidationLandings();

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][2023-10-09-WA1][2]');
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-SPECIES-FOUND-ON-CATCH-CERTIFICATES][2023-10-09-WA1][2]');
    expect(results).toStrictEqual(expected);
  });

  it('will update the landings consolidate landings collection with the same species used across mutiple documents', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 2.6,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 100,
        isEstimate: false
      }]
    }];

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 100,
        isEstimate: false,
        isOverusedAllCerts: true,
        exportWeight: 360,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          isHighRisk: true,
          isPreApproved: false,
          weight: 260,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          isHighRisk: true,
          isPreApproved: false,
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }];

    await consolidateLandings(transformedLandings);

    const results = await ConsolidateLandings.getConsolidationLandings();

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][2023-10-09-WA1][2]');
    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][NUMBER-OF-SPECIES-FOUND-ON-CATCH-CERTIFICATES][2023-10-09-WA1][1]');
    expect(results).toStrictEqual(expected);
  });

  it('will update the landings consolidate landings collection upon the submission of the Catch Certificate', async () => {

    const originalCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 20, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 20,
        isEstimate: false,
        exportWeight: 100,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    })

    await consolidatedLanded.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].exportWeight).toBe(200);
    expect(updatedConsolidatedLanding.items[0].landedWeight).toBe(20);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);

  });

  it('will catch any error thrown whilst refreshing risking data', async () => {
    mockRefreshRiskingData.mockRejectedValue(new Error('something went wrong'));
    const originalCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 5, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 20,
        isEstimate: false,
        exportWeight: 100,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    })

    await consolidatedLanded.save();

    await updateConsolidateLandings("CC2");

    expect(mockLoggerError).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][CC2][REFRESH-RISKING-DATA][ERROR][Error: something went wrong]');
    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].exportWeight).toBe(200);
    expect(updatedConsolidatedLanding.items[0].landedWeight).toBe(5);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
  });

  it('will update the landings consolidate landings collection upon the submission of the Catch Certificate with updated landing information', async () => {

    const originalCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 5, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    })

    await consolidatedLanded.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].exportWeight).toBe(200);
    expect(updatedConsolidatedLanding.items[0].landedWeight).toBe(5);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);

  });

  it('will find other Catch Certificates containing a landing on the current submission', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const updateCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await updateCatchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 20, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC2");

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][TOTAL-NUMBER-OF-CATCH-CERTIFICATES][2]');
    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
  });

  it('will exclude other landings for which landing data does not exist', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              },
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA2",
                date: "2020-01-02",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const updateCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await updateCatchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 20, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC2");

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][TOTAL-NUMBER-OF-CATCH-CERTIFICATES][2]');
    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
  });

  it('will build landing consolidation if one does not exist upon the submission of the Catch Certificate', async () => {
    const originalCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].exportWeight).toBe(1100);
    expect(updatedConsolidatedLanding.items[0].landedWeight).toBe(200);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);

  });

  it('will not consolidate if no landings can be found', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding).toBeNull();
  });

  it('will not consolidate if the species can not be found on the landing', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][EXPORT-LANDING][CC1-1][SPECIES-MIS-MATCH][HER]')
    expect(updatedConsolidatedLanding).toBeNull();
  });

  it('will consolidate species aliases if found on the landing', async () => {
    const originalCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-MON",
            speciesCode: "MON",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-MON",
            speciesCode: "MON",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'ANF', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].exportWeight).toBe(1100);
    expect(updatedConsolidatedLanding.items[0].landedWeight).toBe(200);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
  });

  it('will consolidate species mismatch within a deminmus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.source).toBe(LandingSources.ELog);
    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].isWithinDeminimus).toBe(true);
    expect(updatedConsolidatedLanding.items[0].isEstimate).toBe(true);
    expect(updatedConsolidatedLanding.items[0].exportWeight).toBe(50);
    expect(updatedConsolidatedLanding.items[0].landedWeight).toBe(0);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(1);
  });

  it('will consolidate species mismatch within a deminmus with exporter details', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        exporterDetails: {
          exporterFullName: "Joe Blogg",
          exporterCompanyName: "Company name",
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: '',
          _dynamicsUser: '',
          accountId: 'some-accontId',
          contactId: 'some-contactId'
        },
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.source).toBe(LandingSources.ELog);
    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].isWithinDeminimus).toBe(true);
    expect(updatedConsolidatedLanding.items[0].isEstimate).toBe(true);
    expect(updatedConsolidatedLanding.items[0].exportWeight).toBe(50);
    expect(updatedConsolidatedLanding.items[0].landedWeight).toBe(0);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(1);
  });

  it('will not consolidate species mismatch above a deminmus', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 51,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })
    expect(updatedConsolidatedLanding).toBeNull();
  });

  it('will not consolidate species without landings', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 51,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: []
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][EXPORT-LANDING][CC1-1][SPECIES-MIS-MATCH][HER]');

    expect(updatedConsolidatedLanding).toBeNull();
  });

  it('will not consolidate species with empty landings', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 51,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][EXPORT-LANDING][CC1-1][SPECIES-MIS-MATCH][HER]');

    expect(updatedConsolidatedLanding).toBeNull();
  });

  it('will catch any errors thrown whilst updating the landings consolidation collection', async () => {
    mockUpdateMany.mockRejectedValue(new Error('something has gone wrong'));

    const originalCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding).toBeNull();

    expect(mockLoggerError).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][UPDATE-LANDINGS][ERROR][Error: something has gone wrong]');
  });

  it('will not update the landings consolidation table if the document can not be found', async () => {

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })
    expect(updatedConsolidatedLanding).toBeNull();
  });

  it('will return landing consolidation using exporter details to calculate risk', async () => {
    const originalCatchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        exporterDetails: {
          exporterFullName: "Joe Blogg",
          exporterCompanyName: "Company name",
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: '',
          _dynamicsUser: '',
          accountId: 'some-accontId',
          contactId: 'some-contactId'
        },
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        exporterDetails: {
          exporterFullName: "Joe Blogg",
          exporterCompanyName: "Company name",
          addressOne: "123 Unit 1 CJC Fish Ltd 17 Old Edinburgh Road",
          buildingNumber: '123',
          subBuildingName: 'Unit 1',
          buildingName: 'CJC Fish Ltd',
          streetName: '17  Old Edinburgh Road',
          county: 'West Midlands',
          country: 'England',
          townCity: "Aberdeen",
          postcode: "AB1 2XX",
          _dynamicsAddress: '',
          _dynamicsUser: '',
          accountId: 'some-accontId',
          contactId: 'some-contactId'
        },
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC1");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
  });

  it('will log when no landings are found on a document', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
                vesselOverriddenByAdmin: true
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    await updateConsolidateLandings("CC1");

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][DOCUMENT][CC1][UPDATE][NO-LANDING-ON-CC]')
  });

  it('will log when an rssNumber is not found', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "NORSSNUMBER",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    await updateConsolidateLandings("CC1");

    expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDING-CONSOLIDATION][DOCUMENT][CC1][UPDATE][NO-LANDING-ON-CC-WITH-RSS-NUMBER]')
  });

  it('will update isWithinDeminmus to true', async () => {
    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: false,
        exportWeight: 50,
        isWithinDeminimus: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
    expect(updatedConsolidatedLanding.items[0].isWithinDeminimus).toBe(true);
  });

  it('will update isWithinDeminmus to true for multiple with difference species', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].isWithinDeminimus).toBe(true);
  });

  it('will update isWithinDeminmus to true for multiple elog species mis-match with difference species', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'LBE', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(2);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].isWithinDeminimus).toBe(true);
    expect(updatedConsolidatedLanding.items[1].landings).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[1].isWithinDeminimus).toBe(true);
  });

  it('will update isWithinDeminmus to true for multiple elog species mis-match with same species', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'LBE', weight: 200, factor: 1 }]
    });

    await model.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
    expect(updatedConsolidatedLanding.items[0].isWithinDeminimus).toBe(true);
  });

  it('will correctly perist isPreApproved for previously submitted documents', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'LBE', weight: 200, factor: 1 }]
    });

    await model.save();

    const preApprovedDocument = new PreApprovedDocumentModel({
      documentNumber: "CC1",
      preApprovedBy: "Bob",
      certificateData: "somedata"
    });

    await preApprovedDocument.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
    expect(updatedConsolidatedLanding.items[0].landings?.[0].documentNumber).toBe("CC1");
    expect(updatedConsolidatedLanding.items[0].landings?.[0].isPreApproved).toBe(true);
    expect(updatedConsolidatedLanding.items[0].landings?.[1].documentNumber).toBe("CC2");
    expect(updatedConsolidatedLanding.items[0].landings?.[1].isPreApproved).toBe(false);
  });

  it('will correctly perist isPreApproved for currently submitted documents', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'LBE', weight: 200, factor: 1 }]
    });

    await model.save();

    const preApprovedDocument = new PreApprovedDocumentModel({
      documentNumber: "CC2",
      preApprovedBy: "Bob",
      certificateData: "somedata"
    });

    await preApprovedDocument.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
    expect(updatedConsolidatedLanding.items[0].landings?.[0].documentNumber).toBe("CC1");
    expect(updatedConsolidatedLanding.items[0].landings?.[0].isPreApproved).toBe(false);
    expect(updatedConsolidatedLanding.items[0].landings?.[1].documentNumber).toBe("CC2");
    expect(updatedConsolidatedLanding.items[0].landings?.[1].isPreApproved).toBe(true);
  });

  it('will correctly perist isPreApproved for multiple pre approved submitted documents', async () => {
    let catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'LBE', weight: 200, factor: 1 }]
    });

    await model.save();

    let preApprovedDocument = new PreApprovedDocumentModel({
      documentNumber: "CC1",
      preApprovedBy: "Bob",
      certificateData: "somedata"
    });

    await preApprovedDocument.save();

    preApprovedDocument = new PreApprovedDocumentModel({
      documentNumber: "CC2",
      preApprovedBy: "Bob",
      certificateData: "somedata"
    });

    await preApprovedDocument.save();

    await updateConsolidateLandings("CC2");

    const updatedConsolidatedLanding: IConsolidateLanding = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })

    expect(updatedConsolidatedLanding.items).toHaveLength(1);
    expect(updatedConsolidatedLanding.items[0].landings).toHaveLength(2);
    expect(updatedConsolidatedLanding.items[0].landings?.[0].documentNumber).toBe("CC1");
    expect(updatedConsolidatedLanding.items[0].landings?.[0].isPreApproved).toBe(true);
    expect(updatedConsolidatedLanding.items[0].landings?.[1].documentNumber).toBe("CC2");
    expect(updatedConsolidatedLanding.items[0].landings?.[1].isPreApproved).toBe(true);
  });

  it('will void the usage of landing on a single document', async () => {
    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        isOverusedAllCerts: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will void the usage of landing with a elog species mis-match on a single document', async () => {
    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: false,
        exportWeight: 50,
        isWithinDeminimus: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will void the usage of landing with a elog species mis-match on multiple documents', async () => {
    const originalCatchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await originalCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: false,
        exportWeight: 50,
        isWithinDeminimus: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: false,
        exportWeight: 50,
        isWithinDeminimus: true,
        isOverusedAllCerts: false,
        landings: [{
          landingId: "CC2-1",
          documentNumber: "CC2",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    }];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will void and update the usage of landing with a elog species mis-match on a single document', async () => {
    const voidCatchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 50,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await voidCatchCert.save();

    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 51,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.ELog,
      items: [{ species: 'HER', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.ELog,
      items: [{
        species: "COD",
        landedWeight: 0,
        isEstimate: false,
        exportWeight: 101,
        isWithinDeminimus: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 50,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          weight: 51,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will not void the usage of landing on a single document where the consilidated landing has no landing', async () => {
    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        isOverusedAllCerts: false
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: false,
        exportWeight: 100,
        landings: []
      }]
    }];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will void the usage of landing on a single document with multiple landing items', async () => {
    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          },
          {
            speciesId: "CC1-2-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        isOverusedAllCerts: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }, {
        species: "HER",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        isOverusedAllCerts: true,
        landings: [{
          landingId: "CC1-2",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will not void the usage on a complete document', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        isOverusedAllCerts: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: false,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: true,
        exportWeight: 100,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          isHighRisk: false,
          isPreApproved: false,
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    }];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will not void the usage of landing on a single document with no rssNumber', async () => {
    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA3",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
                vesselOverriddenByAdmin: true
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: false,
        exportWeight: 0,
        landings: []
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: false,
        exportWeight: 0,
        landings: []
      }]
    }];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will not void the usage of landing on a single document with no consolidate landngs', async () => {
    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const expected: IConsolidateLanding[] = [];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will void the usage of landing used in multiple documents for only the VOID document', async () => {
    let catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC2",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC2-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC2-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC3",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC3-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC3-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 1200,
        isOverusedAllCerts: true,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: true,
          isPreApproved: false
        }, {
          landingId: "CC2-1",
          documentNumber: "CC2",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: true,
          isPreApproved: false
        }, {
          landingId: "CC3-1",
          documentNumber: "CC3",
          weight: 1000,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD'),
          isHighRisk: true,
          isPreApproved: false
        }]
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: true,
        exportWeight: 1100,
        landings: [
          {
            landingId: "CC2-1",
            documentNumber: "CC2",
            isHighRisk: true,
            isPreApproved: false,
            weight: 100,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().format('YYYY-MM-DD')
          },
          {
            landingId: "CC3-1",
            documentNumber: "CC3",
            isHighRisk: true,
            isPreApproved: false,
            weight: 1000,
            dataEverExpected: true,
            landingDataExpectedDate: "2023-10-11",
            landingDataEndDate: moment.utc().format('YYYY-MM-DD')
          }
        ]
      }]
    }];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will void the usages of a document with multiple landings', async () => {
    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          },
          {
            speciesId: "CC1-2-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA2",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          },

        ]
      }
    });

    await catchCert.save();

    let consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        isOverusedAllCerts: false,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    })

    await consolidatedLanded.save();

    consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA2",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        isOverusedAllCerts: false,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    })

    await consolidatedLanded.save();

    await voidConsolidateLandings('CC1');
    const rssWA1 = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA1", dateLanded: "2020-01-01" })
    const rssWA2 = await ConsolidateLandings.getConsolidationLanding({ rssNumber: "rssWA2", dateLanded: "2020-01-01" })

    expect(rssWA1).toBeNull();
    expect(rssWA2).toBeNull();
  });

  it('will log error found whilst voiding landings', async () => {
    mockDeleteMany.mockRejectedValue(new Error('something has gone wrong'));

    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        exportWeight: 100,
        landings: [{
          landingId: "CC1-1",
          documentNumber: "CC1",
          weight: 100,
          dataEverExpected: true,
          landingDataExpectedDate: "2023-10-11",
          landingDataEndDate: moment.utc().format('YYYY-MM-DD')
        }]
      }]
    })

    await consolidatedLanded.save();

    await voidConsolidateLandings('CC1');
    expect(mockLoggerError).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][VOID-LANDINGS][ERROR][Error: something has gone wrong]');
  });

  it('will not void if empty landings are found in the consolidated landing', async () => {

    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: false,
        exportWeight: 100,
        landings: []
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: false,
        exportWeight: 100,
        landings: []
      }]
    }];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will not void if no landings are found in the consolidated landing', async () => {

    const catchCert = new CatchCertificateModel({
      status: "VOID",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-COD",
            speciesCode: "COD",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "WHL",
              name: "Whloe"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2020-01-01",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const model = new LandingModel({
      rssNumber: 'rssWA1',
      dateTimeLanded: moment.utc('2020-01-01'),
      source: LandingSources.LandingDeclaration,
      items: [{ species: 'COD', weight: 200, factor: 1 }]
    });

    await model.save();

    const consolidatedLanded = new ConsolidateLandingModel({
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: false,
        exportWeight: 100
      }]
    })

    await consolidatedLanded.save();

    const expected: IConsolidateLanding[] = [{
      dateLanded: "2020-01-01",
      rssNumber: "rssWA1",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "COD",
        landedWeight: 200,
        isEstimate: false,
        isOverusedAllCerts: false,
        exportWeight: 100,
        landings: []
      }]
    }];

    await voidConsolidateLandings('CC1');
    const results = await ConsolidateLandings.getConsolidationLandings();
    expect(results).toStrictEqual(expected);
  });

  it('will log the rssNumber and dateLanded for each certificate using a list of landings', async () => {
    const catchCert = new CatchCertificateModel({
      status: "COMPLETE",
      __t: "catchCert",
      documentNumber: "CC1",
      createdAt: "2019-07-10T08:26:06.939Z",
      createdBy: "Bob",
      createdByEmail: "foo@foo.com",
      exportData: {
        products: [
          {
            speciesId: "CC1-1-HER",
            speciesCode: "HER",
            state: {
              code: "FRE",
              name: "Fresh"
            },
            presentation: {
              code: "FIS",
              name: "Filleted and skinned"
            },
            factor: 2.6,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 1000,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              },
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA2",
                date: "2023-10-10",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: moment.utc().format('YYYY-MM-DD')
              }
            ]
          }
        ]
      }
    });

    await catchCert.save();

    const landings: ILanding[] = [{
      dateTimeLanded: "2023-10-09T00:30:00.000Z",
      rssNumber: "rssWA1",
      items: [
        {
          species: "HER",
          weight: 1,
          factor: 1,
          state: "FRE",
          presentation: "WHL"
        }
      ],
      source: "ELOG"
    }];

    const result = await findAllCatchCertificates(landings);

    expect(result).toHaveLength(1);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, '[LANDINGS-CONSOLIDATION][FINDING-USAGES-FOR][rssWA1-2023-10-09]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, '[LANDINGS-CONSOLIDATION][FOUND-PLN][rssWA1-2023-10-09][PLN: WA1]');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(4, '[LANDINGS-CONSOLIDATION][NUMBER-OF-CATCH-CERTIFICATE-REFERENCING][rssWA1-2023-10-09][1]');
  });
});

describe('consolidate landing service - getLandingsRefresh', () => {
  let mockGetRetrospectiveConsolidate: jest.SpyInstance;

  beforeEach(() => {
    mockGetRetrospectiveConsolidate = jest.spyOn(ConsolidateLandings, 'getRetrospectiveConsolidatedLandings');
    mockGetRetrospectiveConsolidate.mockResolvedValue([]);
  })

  afterEach(() => {
    mockGetRetrospectiveConsolidate.mockRestore();
  })

  it('will call get retrospective consolidated landings', async () => {
    const results = await getLandingsRefresh();
    expect(results).toHaveLength(0);
  })
});

import { ILandingQuery, LandingSources, generateIndex } from "mmo-shared-reference-data";
import { buildLandingsSpeciesIdx, mapPlnLandingsToRssLandings, transformLandings, uniquifyLandings } from "../../../src/landings/transformations/landing";
import { CatchCertificate, IConsolidateLanding, ILandingDetail, ILandingSpeciesIdx } from "../../../src/types";
import * as Cache from '../../../src/data/cache';
import * as PreApprovedDocument from '../../../src/landings/persistence/preApprovedDocument';
import * as Risking from '../../../src/data/risking';

describe('when transforming landings', () => {

  it('should return a consoldated landing for LANDING_DECLARATION', () => {

    const dataFromDb = [{
      dateTimeLanded: '2023-10-09T00:30:00.000Z',
      rssNumber: 'C20514',
      dateTimeRetrieved: '2023-10-09T10:40:11.363Z',
      items: [
        {
          species: 'HER',
          weight: 2800,
          factor: 2,
          state: 'FRE',
          presentation: 'WHL',
        }
      ],
      source: LandingSources.LandingDeclaration
    }];

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "C20514",
      source: LandingSources.LandingDeclaration,
      items: [{
        species: "HER",
        landedWeight: 5600,
        isEstimate: false
      }]
    }];

    const results = transformLandings(dataFromDb);
    expect(results).toHaveLength(1);
    expect(results).toEqual(transformedLandings)
  });

  it('should return a consolidated landing for CATCH_RECORDING', () => {

    const dataFromDb = [{
      dateTimeLanded: '2023-10-09T00:30:00.000Z',
      rssNumber: 'C20514',
      dateTimeRetrieved: '2023-10-09T10:40:11.363Z',
      items: [
        {
          species: 'HER',
          weight: 2800,
          state: 'FRE',
          presentation: 'WHL',
        }
      ],
      source: LandingSources.CatchRecording
    }];

    const transformedLandings: IConsolidateLanding[] = [{
      dateLanded: "2023-10-09",
      rssNumber: "C20514",
      source: LandingSources.CatchRecording,
      items: [{
        species: "HER",
        isEstimate: true,
        landedWeight: 2800
      }]
    }];

    // @ts-expect-error to test the absence of factor, should use 1
    const results = transformLandings(dataFromDb);
    expect(results).toHaveLength(1);
    expect(results).toEqual(transformedLandings)
  });

  it('should return a consoldated landing for multiple landings', () => {

    const dataFromDb = [{
      dateTimeLanded: '2023-10-09T00:30:00.000Z',
      rssNumber: 'rssWA1',
      dateTimeRetrieved: '2023-10-09T10:40:11.363Z',
      items: [
        {
          species: 'HER',
          weight: 100,
          factor: 1,
          state: 'FRE',
          presentation: 'WHL',
        }
      ],
      source: LandingSources.LandingDeclaration
    }, {
      dateTimeLanded: '2023-10-09T00:30:00.000Z',
      rssNumber: 'rssWA2',
      dateTimeRetrieved: '2023-10-09T10:40:11.363Z',
      items: [
        {
          species: 'COD',
          weight: 100,
          factor: 2,
          state: 'FRE',
          presentation: 'WHL',
        }
      ],
      source: LandingSources.CatchRecording
    }];

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

    const results = transformLandings(dataFromDb);
    expect(results).toHaveLength(2);
    expect(results).toEqual(transformedLandings)
  });

});

describe('when building a dictionary of landings indexable by species', () => {

  let mockIsDocumentPreApproved: jest.SpyInstance;
  let mockIsHighRisk: jest.SpyInstance;

  beforeEach(() => {
    mockIsDocumentPreApproved = jest.spyOn(PreApprovedDocument, 'isDocumentPreApproved');
    mockIsDocumentPreApproved.mockResolvedValue(false);

    mockIsHighRisk = jest.spyOn(Risking, 'isHighRisk');
  })

  afterEach(() => {
    mockIsDocumentPreApproved.mockRestore();
    mockIsHighRisk.mockRestore();
  })

  it('should build a dictionary with COD', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with COD across multiple documents', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },
      {
        landingId: "CC2-1",
        documentNumber: "CC2",
        isHighRisk: false,
        isPreApproved: false,
        weight: 100,
        dataEverExpected: true,
        landingDataEndDate: "2023-10-13",
        landingDataExpectedDate: "2023-10-11",
      },
      {
        landingId: "CC3-1",
        documentNumber: "CC3",
        isHighRisk: false,
        isPreApproved: false,
        weight: 10,
        dataEverExpected: true,
        landingDataEndDate: "2023-10-13",
        landingDataExpectedDate: "2023-10-11",
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }, {
      status: "COMPLETE",
      documentNumber: "CC2",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }, {
      status: "COMPLETE",
      documentNumber: "CC3",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC3-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 10,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with COD across multiple documents ignoring usages on other landings', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },
      {
        landingId: "CC3-1",
        documentNumber: "CC3",
        isHighRisk: false,
        isPreApproved: false,
        weight: 10,
        dataEverExpected: true,
        landingDataEndDate: "2023-10-13",
        landingDataExpectedDate: "2023-10-11",
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }, {
      status: "COMPLETE",
      documentNumber: "CC2",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
                date: "2023-10-10",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }, {
      status: "COMPLETE",
      documentNumber: "CC3",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC3-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 10,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with COD and HER across multiple documents', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },
      {
        landingId: "CC3-1",
        documentNumber: "CC3",
        isHighRisk: false,
        isPreApproved: false,
        weight: 10,
        dataEverExpected: true,
        landingDataEndDate: "2023-10-13",
        landingDataExpectedDate: "2023-10-11",
      }],
      'HER': [{
        landingId: "CC2-1",
        documentNumber: "CC2",
        isHighRisk: false,
        isPreApproved: false,
        weight: 100,
        dataEverExpected: true,
        landingDataEndDate: "2023-10-13",
        landingDataExpectedDate: "2023-10-11",
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }, {
      status: "COMPLETE",
      documentNumber: "CC2",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }, {
      status: "COMPLETE",
      documentNumber: "CC3",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC3-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 10,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with COD and HER over the same document', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }],
      'HER': [{
        landingId: "CC1-2",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 100,
        dataEverExpected: true,
        landingDataEndDate: "2023-10-13",
        landingDataExpectedDate: "2023-10-11",
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
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
              name: "Whole"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with mutiple COD over the same document', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC1-2",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 100,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
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
              code: "GUT",
              name: "Gutted"
            },
            factor: 1,
            caughtBy: [
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with mutiple COD within the same caught by', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC1-2",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              },
              {
                id: "CC1-2",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with mutiple COD within the same caught by with the same landing id', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      },{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              },
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with COD for a pre approved document', async () => {
    mockIsDocumentPreApproved.mockResolvedValue(true);

    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: true,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with COD with exporter details', async () => {
    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: false,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })

  it('should build a dictionary with COD with is high risk set as true', async () => {
    mockIsHighRisk.mockReturnValue(true) 

    const landing: ILandingDetail = { pln: 'WA1', dateLanded: '2023-10-09', rssNumber: 'rssWA1' };
    const speciesIdx: ILandingSpeciesIdx = {
      'COD': [{
        landingId: "CC1-1",
        documentNumber: "CC1",
        isHighRisk: true,
        isPreApproved: false,
        weight: 200,
        dataEverExpected: true,
        landingDataExpectedDate: "2023-10-11",
        landingDataEndDate: "2023-10-13"
      }]
    }

    const documents: CatchCertificate[] = [{
      status: "COMPLETE",
      documentNumber: "CC1",
      createdAt: new Date("2019-07-10T08:26:06.939Z"),
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
              name: "Whole"
            },
            factor: 2,
            caughtBy: [
              {
                id: "CC1-1",
                vessel: "DAYBREAK",
                pln: "WA1",
                date: "2023-10-09",
                weight: 100,
                dataEverExpected: true,
                landingDataExpectedDate: "2023-10-11",
                landingDataEndDate: "2023-10-13"
              }
            ]
          }
        ]
      }
    }];

    const result = await buildLandingsSpeciesIdx(documents, landing);
    expect(result).toStrictEqual(speciesIdx);
  })
});

describe('when mapping landings to rssNumbers', () => {

  const vesselData = [
    {
      registrationNumber:"WA1",
      fishingLicenceValidTo:"2100-12-20T00:00:00",
      fishingLicenceValidFrom:"2000-12-29T00:00:00",
      rssNumber: "rssWA1",
      licenceHolderName: "Mr Doe"
    },
    {
      registrationNumber:"WA2",
      fishingLicenceValidTo:"2100-12-20T00:00:00",
      fishingLicenceValidFrom:"2000-12-29T00:00:00",
      rssNumber: "rssWA2",
      licenceHolderName: "Mr Smith"
    },
    {
      registrationNumber:"WA3",
      fishingLicenceValidTo:"2100-12-20T00:00:00",
      fishingLicenceValidFrom:"2000-12-29T00:00:00",
      rssNumber: "rssWA3",
      licenceHolderName: "Mr Bob"
    },
    {
      registrationNumber:"WA4",
      fishingLicenceValidTo:"2100-12-20T00:00:00",
      fishingLicenceValidFrom:"2000-12-29T00:00:00",
      rssNumber: "rssWA4",
      licenceHolderName: "Mr Doe"
    },
    {
      registrationNumber:"WA5",
      fishingLicenceValidTo:"2100-12-20T00:00:00",
      fishingLicenceValidFrom:"2000-12-29T00:00:00",
      rssNumber: "rssWA5"
    }
  ];
  
  const vesselIdx = generateIndex(vesselData);
  

  let mockGetVesselIdxStub: jest.SpyInstance;

  beforeEach(() => {
    mockGetVesselIdxStub = jest.spyOn(Cache, 'getVesselsIdx');
    mockGetVesselIdxStub.mockReturnValue(vesselIdx);
  });

  afterEach(() => {
    mockGetVesselIdxStub.mockRestore();
  });

  it('will collate all landings in a single list', () => {

    const catchCertificates = [
      { pln : "WA1", dateLanded : "2015-10-06", createdAt: "2020-09-26T08:26:06.939Z", landingDataEndDate: "2020-10-01", landingDataExpectedDate: "2020-09-26", dataEverExpected: true },
      { pln : "WA1", dateLanded : "2014-10-06", createdAt: "2020-09-26T08:26:06.939Z", landingDataEndDate: "2020-10-01", landingDataExpectedDate: "2020-09-26", dataEverExpected: true },
      { pln : "WA2", dateLanded : "2019-10-06", createdAt: "2020-09-26T08:26:06.939Z", landingDataEndDate: "2020-10-01", landingDataExpectedDate: "2020-09-26", dataEverExpected: true },
      { pln : "WA3", dateLanded : "2018-10-06", createdAt: "2020-09-26T08:26:06.939Z", landingDataEndDate: "2020-10-01", landingDataExpectedDate: "2020-09-26", dataEverExpected: true },
      { pln : "WA4", dateLanded : "2017-10-06", createdAt: "2020-09-26T08:26:06.939Z", landingDataEndDate: "2020-10-01", landingDataExpectedDate: "2020-09-26", dataEverExpected: true }
    ];

    const expectedResult: ILandingQuery[] = [
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2014-10-06" },
      { rssNumber : "rssWA2", dateLanded : "2019-10-06" },
      { rssNumber : "rssWA3", dateLanded : "2018-10-06" },
      { rssNumber : "rssWA4", dateLanded : "2017-10-06" }
    ];

    const result = mapPlnLandingsToRssLandings(catchCertificates);

    expect(result).toEqual(expectedResult);

  });

  it('will exclude landings that do not return an rssNumber', () => {

    const catchCertificates = [
      { pln : "WA1",           dateLanded : "2015-10-06", createdAt: "2020-09-26T08:26:06.939Z", landingDataEndDate: "2020-10-01", landingDataExpectedDate: "2020-09-26", dataEverExpected: true },
      { pln : "WANoRssNumber", dateLanded : "2017-10-06", createdAt: "2020-09-26T08:26:06.939Z", landingDataEndDate: "2020-10-01", landingDataExpectedDate: "2020-09-26", dataEverExpected: true }
    ];

    const expectedResult: ILandingQuery[] = [
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" }
    ];

    const result = mapPlnLandingsToRssLandings(catchCertificates);

    expect(result).toEqual(expectedResult);
  });

});

describe('when uniquifying the landings', () => {

  it('will return a single landings', () => {
    const landings: ILandingQuery[] = [
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" }
    ];

    const expectedResult: ILandingQuery[] = [
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" }
    ];

    const result = uniquifyLandings(landings);
    expect(expectedResult).toStrictEqual(result);
  });

  it('will return a unique set of landings', () => {
    const landings: ILandingQuery[] = [
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA2", dateLanded : "2019-10-06" },
      { rssNumber : "rssWA3", dateLanded : "2018-10-06" },
      { rssNumber : "rssWA3", dateLanded : "2018-10-06" }
    ];

    const expectedResult: ILandingQuery[] = [
      { rssNumber : "rssWA1", dateLanded : "2015-10-06" },
      { rssNumber : "rssWA2", dateLanded : "2019-10-06" },
      { rssNumber : "rssWA3", dateLanded : "2018-10-06" }
    ];

    const result = uniquifyLandings(landings);
    expect(expectedResult).toStrictEqual(result);
  });
  
});
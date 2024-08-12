import { isEmpty } from 'lodash';
import { IVessel } from "mmo-shared-reference-data";
import { getConversionFactorsData, getExporterBehaviourData, getSpeciesAliasesFromBlob, getVesselDateFromBlob } from "../../src/data/blob-storage";
import logger from '../../src/logger';

const vesselData: IVessel[] = [{
  fishingVesselName: 'MARLENA',
  ircs: null,
  flag: 'GBR',
  homePort: 'WESTRAY',
  registrationNumber: 'K529',
  imo: null,
  fishingLicenceNumber: '30117',
  fishingLicenceValidFrom: '2006-06-07T00:00:00',
  fishingLicenceValidTo: '2006-06-30T00:00:00',
  adminPort: 'STORNOWAY',
  rssNumber: 'A12032',
  vesselLength: 8.84,
  cfr: 'GBRA12032',
  licenceHolderName: "I am the Licence Holder name for this fishing boat"
},
{
  fishingVesselName: "WIRON 5",
  ircs: "2HGD8",
  cfr: "NLD200202641",
  flag: "GBR",
  homePort: "PLYMOUTH",
  registrationNumber: "H1100",
  imo: 9249556,
  fishingLicenceNumber: "12480",
  fishingLicenceValidFrom: "2021-08-10T00:00:00",
  fishingLicenceValidTo: "2030-12-31T00:00:00",
  adminPort: "PLYMOUTH",
  rssNumber: "C20514",
  vesselLength: 50.63,
  licenceHolderName: "INTERFISH WIRONS LIMITED"
},
{
  fishingVesselName: "ATLANTA II",
  ircs: "MJAU2",
  cfr: "GBR000A21401",
  flag: "GBR",
  homePort: "MILFORD HAVEN",
  registrationNumber: "M82",
  imo: null,
  fishingLicenceNumber: "11685",
  fishingLicenceValidFrom: "2016-05-03T00:00:00",
  fishingLicenceValidTo: "2030-12-31T00:00:00",
  adminPort: "MILFORD HAVEN",
  rssNumber: "A21401",
  vesselLength: 11.75,
  licenceHolderName: "MR  SIMON COLL"
}];

jest.mock('azure-storage', () => ({
  ...jest.requireActual('azure-storage'),
  createBlobService: (connectionString: string) => {
    if (isEmpty(connectionString)) {
      throw new Error('connection string can not be empty')
    }

    return {
      getBlobToText: jest.fn().mockImplementation((containerName, blobName, cb) => {
        if (connectionString === 'blob-storage-connection-error') {
          return cb(new Error('VesselsMockError'));
        }

        if (connectionString === 'blob-storage-connection-error-2') {
          return cb(null, '[{ "viewName": "Dummy", "blobName": "vessels.json" }]');
        }

        if (blobName === 'Notification.json') {
          return cb(null, '[{ "viewName": "VesselAndLicenceData", "blobName": "vessels.json" }]');
        }

        if (blobName === 'exporter_behaviour.csv') {
          return cb(null, 'accountId,contactId,name,score\nID1,,Exporter 1,0.5\nID2,,Exporter 2,0.75');
        }

        if (blobName === 'speciesmismatch.json') {
          return cb(null, JSON.stringify([{
            speciesName: "Squid",
            speciesCode: "SQC",
            speciesAlias: ["SQR", "SQZ", "SQI"]
          },]));
        }

        if (blobName === 'conversionfactors.csv') {
          return cb(null, 'species,state,presentation,toLiveWeightFactor,quotaStatus,riskScore\nALB,FRE,GUT,1.11,quota,1');
        }

        return cb(null, JSON.stringify(vesselData));
      })
    }
  }
}));

describe('when getting vessel data from blob', () => {

  it('will get vessel data', async () => {
    const results = await getVesselDateFromBlob('blob-storage-connection-string');
    expect(results).toHaveLength(3);
  });

  it('will throw an error when the blob store is unable to get vessel details', async () => {
    await expect(getVesselDateFromBlob('blob-storage-connection-error')).rejects.toThrow();
  });

  it('will throw an error when notification json can not be found', async () => {
    await expect(getVesselDateFromBlob('blob-storage-connection-error-2')).rejects.toThrow();
  });

  it('will throw an error when no connection string is provided', async () => {
    await expect(getVesselDateFromBlob('')).rejects.toThrow();
  });

});

describe('getExporterBehaviourData', () => {

  let mockLogError: jest.SpyInstance;

  beforeEach(() => {
    mockLogError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    mockLogError.mockRestore();
  });

  it('will log and rethrow any errors', async () => {
    const error = new Error('connection string can not be empty');

    await expect(getExporterBehaviourData('')).rejects.toThrow(error);

    expect(mockLogError).toHaveBeenNthCalledWith(1, error);
    expect(mockLogError).toHaveBeenNthCalledWith(2, 'Cannot read remote file exporter_behaviour.csv from container exporterbehaviour')
  });

  it('will return exporter behaviour data', async () => {
    const expected = [
      { accountId: 'ID1', name: 'Exporter 1', score: 0.5 },
      { accountId: 'ID2', name: 'Exporter 2', score: 0.75 }
    ]

    const res = await getExporterBehaviourData('connString');

    expect(res).toStrictEqual(expected);
  });

});

describe('getSpeciesAliasesFromBlob', () => {
  let mockLogError: jest.SpyInstance;

  const container = 'speciesmismatch';
  const file = 'speciesmismatch.json';

  beforeEach(() => {
    mockLogError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will log and rethrow any errors', async () => {
    const error = new Error('connection string can not be empty');

    await expect(getSpeciesAliasesFromBlob('')).rejects.toThrow('Error: connection string can not be empty');

    expect(mockLogError).toHaveBeenNthCalledWith(1, error);
    expect(mockLogError).toHaveBeenNthCalledWith(2, `Cannot read remote file ${file} from container ${container}`);
  });

  it('will return species aliases data', async () => {
    const res = await getSpeciesAliasesFromBlob('connString');
    expect(res).toStrictEqual({ "SQC": ["SQR", "SQZ", "SQI"] });
  });
});

describe('getConversionFactorsData', () => {

  let mockLogError;

  const container = 'conversionfactors';
  const file = 'conversionfactors.csv'

  beforeEach(() => {
      mockLogError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
      jest.restoreAllMocks();
  });

  it('will log and rethrow any errors', async () => {
      const error = new Error('connection string can not be empty');

      await expect(getConversionFactorsData('')).rejects.toThrow('Error: connection string can not be empty');

      expect(mockLogError).toHaveBeenNthCalledWith(1, error);
      expect(mockLogError).toHaveBeenNthCalledWith(2, `Cannot read remote file ${file} from container ${container}`);
  });

  it('will return conversion factors data', async () => {
      const res = await getConversionFactorsData('connString');

      expect(res).toHaveLength(1);
      expect(res[0]).toStrictEqual({
        presentation: "GUT",
        quotaStatus: "quota",
        riskScore: "1",
        species: "ALB",
        state: "FRE",
        toLiveWeightFactor: "1.11"
      });
  });

});

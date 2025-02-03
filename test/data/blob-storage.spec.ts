import { IVessel } from "mmo-shared-reference-data";
import * as blob from "../../src/data/blob-storage";
import logger from '../../src/logger';
import { BlobClient, BlobServiceClient, ContainerClient } from '@azure/storage-blob';
jest.mock("@azure/storage-blob");
import { Readable } from "stream";

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

describe('When getting vessels from a blob storage', () => {
  let mockLogError;
  let mockReadToText;
  let mockBlobClient;
  let mockLoggerInfo;

  const container = 'speciesmismatch';
  const file = 'speciesmismatch.json';

  beforeEach(() => {
      mockLogError = jest.spyOn(logger, 'error');
      mockReadToText = jest.spyOn(blob, 'readToText');
      mockLoggerInfo = jest.spyOn(logger, 'info');

      mockBlobClient = jest.spyOn(BlobServiceClient, 'fromConnectionString');
      const containerObj = new ContainerClient(container);
      containerObj.getBlobClient = () => new BlobClient(file);
      mockBlobClient.mockImplementation(() => ({
          getContainerClient: () => containerObj,
      }));
  });

  afterEach(() => {
      jest.restoreAllMocks();
  });
  
  it('should return a list of vessels with valid connection string', async () => {
      mockReadToText
          .mockReturnValueOnce('[{ "viewName": "VesselAndLicenceData", "blobName": "vessels.json" }]')
          .mockReturnValueOnce(JSON.stringify(vesselData));

      const result = await blob.getVesselDateFromBlob('connString');

      expect(mockLoggerInfo.mock.calls[0][0]).toEqual('connecting to blob storage');
      expect(mockLoggerInfo.mock.calls[1][0]).toEqual('reading notification file');
      expect(mockLoggerInfo.mock.calls[2][0]).toEqual('parsing notification file to json');
      expect(mockLoggerInfo.mock.calls[3][0]).toEqual('searching notification json');
      expect(mockLoggerInfo.mock.calls[4][0]).toEqual('Reading vessel data from');
      expect(result.length).toEqual(3);
  });

  it('should throw an error if vessels key is not defined in notification JSON', async () => {
      mockReadToText.mockReturnValueOnce('[{ "viewName": "other", "blobName": "vessels.json" }]');

      await expect(blob.getVesselDateFromBlob('connString')).rejects.toThrow('Cannot find vessel data in notification json, looking for key VesselAndLicenceData');

      expect(mockLoggerInfo.mock.calls[0][0]).toEqual('connecting to blob storage');
      expect(mockLoggerInfo.mock.calls[1][0]).toEqual('reading notification file');
      expect(mockLoggerInfo.mock.calls[2][0]).toEqual('parsing notification file to json');
      expect(mockLoggerInfo.mock.calls[3][0]).toEqual('searching notification json');
      expect(mockLoggerInfo.mock.calls[4]).toEqual(undefined);
  });

  it('should throw an error if an error is thrown in the try block', async () => {
      const error = new Error('something went wrong')
      mockReadToText.mockRejectedValue(error);

      await expect(blob.getVesselDateFromBlob('connString')).rejects.toThrow('Error: something went wrong');

      expect(mockLoggerInfo.mock.calls[0][0]).toEqual('connecting to blob storage');
      expect(mockLoggerInfo.mock.calls[1][0]).toEqual('reading notification file');

      expect(mockLogError.mock.calls[0][0]).toEqual(error);
      expect(mockLogError.mock.calls[1][0]).toEqual('Cannot read remote file Notification.json from container catchcertdata');
  });
});

describe('getExporterBehaviourData', () => {

  let mockLogError;
  let mockReadToText;
  let mockBlobClient;

  const container = "exporterbehaviour";
  const file = "exporter_behaviour.csv";

  beforeEach(() => {
      mockLogError = jest.spyOn(logger, 'error');
      mockReadToText = jest.spyOn(blob, 'readToText');

      mockBlobClient = jest.spyOn(BlobServiceClient, 'fromConnectionString');
      const containerObj = new ContainerClient(container);
      containerObj.getBlobClient = () => new BlobClient(file);
      mockBlobClient.mockImplementation(() => ({
          getContainerClient: () => containerObj,
      }));
  });

  afterEach(() => {
      jest.restoreAllMocks();
  });

  it('will log and rethrow any errors', async () => {
      const error = new Error('ExporterBehaviourMockError');

      mockReadToText.mockRejectedValue(error);

      await expect(blob.getExporterBehaviourData('connString')).rejects.toThrow('ExporterBehaviourMockError');

      expect(mockLogError).toHaveBeenNthCalledWith(1, error);
      expect(mockLogError).toHaveBeenNthCalledWith(2, 'Cannot read remote file exporter_behaviour.csv from container exporterbehaviour')
  });

  it('will return exporter behaviour data', async () => {
      mockReadToText.mockResolvedValue('accountId,contactId,name,score\nID1,,Exporter 1,0.5\nID2,,Exporter 2,0.75');

      const expected = [
          { accountId: 'ID1', name: 'Exporter 1', score: 0.5 },
          { accountId: 'ID2', name: 'Exporter 2', score: 0.75 }
      ];

      const res = await blob.getExporterBehaviourData('connString');

      expect(res).toStrictEqual(expected);
  });

});

describe('getSpeciesAliases', () => {
  let mockLogError;
  let mockReadToText;
  let mockBlobClient;

  const container = 'speciesmismatch';
  const file = 'speciesmismatch.json';

  beforeEach(() => {
      mockLogError = jest.spyOn(logger, 'error');
      mockReadToText = jest.spyOn(blob, 'readToText');

      mockBlobClient = jest.spyOn(BlobServiceClient, 'fromConnectionString');
      const containerObj = new ContainerClient(container);
      containerObj.getBlobClient = () => new BlobClient(file);
      mockBlobClient.mockImplementation(() => ({
          getContainerClient: () => containerObj,
      }));
  });

  afterEach(() => {
      jest.restoreAllMocks();
  });

  it('will log and rethrow any errors', async () => {
      const error = new Error('SpeciesAliasesMockError');
      mockReadToText.mockRejectedValue(error);
      await expect(blob.getSpeciesAliasesFromBlob('connString')).rejects.toThrow('Error: SpeciesAliasesMockError');

      expect(mockLogError).toHaveBeenNthCalledWith(1, error);
      expect(mockLogError).toHaveBeenNthCalledWith(2, `Cannot read remote file ${file} from container ${container}`);
  });

  it('will return species aliases data', async () => {
      mockReadToText.mockResolvedValue(JSON.stringify([{
        speciesName: "Squid",
        speciesCode: "SQC",
        speciesAlias: ["SQR", "SQZ", "SQI"]
      }]));
      const res = await blob.getSpeciesAliasesFromBlob('connString');

      expect(res).toBeInstanceOf(Object);
      expect.objectContaining({ "SQC": ["SQR", "SQZ", "SQI"] })
  });
});

describe('getConversionFactorsData', () => {

  let mockLogError;
  let mockReadToText;
  let mockBlobClient;

  const container = 'conversionfactors';
  const file = 'conversionfactors.csv'

  beforeEach(() => {
      mockLogError = jest.spyOn(logger, 'error');
      mockReadToText = jest.spyOn(blob, 'readToText');

      mockBlobClient = jest.spyOn(BlobServiceClient, 'fromConnectionString');
      const containerObj = new ContainerClient(container);
      containerObj.getBlobClient = () => new BlobClient(file);
      mockBlobClient.mockImplementation(() => ({
          getContainerClient: () => containerObj,
      }));
  });

  afterEach(() => {
      jest.restoreAllMocks();
  });

  it('will log and rethrow any errors', async () => {
      const error = new Error('ConversionFactorsMockError');

      mockReadToText.mockRejectedValue(error);

      await expect(blob.getConversionFactorsData('connString')).rejects.toThrow('ConversionFactorsMockError');

      expect(mockLogError).toHaveBeenNthCalledWith(1, error);
      expect(mockLogError).toHaveBeenNthCalledWith(2, `Cannot read remote file ${file} from container ${container}`);
  });

  it('will return conversion factors data', async () => {
    mockReadToText.mockResolvedValue('species,state,presentation,toLiveWeightFactor,quotaStatus,riskScore\nALB,FRE,GUT,1.11,quota,1');

    const res = await blob.getConversionFactorsData('connString');

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
describe('readToText', () => {

  let mockBlobClient;

  it('will return downloaded blob as a string', async () => {
      const stream = new Readable();
      stream.push("testing");
      stream.push(null);

      mockBlobClient = {
          download: () => {
              return {
                  readableStreamBody: stream
              }
          }
      }
      const result = await blob.readToText(mockBlobClient);
      expect(result).toEqual('testing');
  });
});
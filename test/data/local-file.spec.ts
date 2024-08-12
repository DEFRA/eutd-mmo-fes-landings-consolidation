import fs from 'fs';
import { IVessel } from "mmo-shared-reference-data";
import {
  getConversionFactors,
  getVesselsOfInterestFromFile,
  getWeightingRiskFromFile,
  getExporterBehaviourFromCSV,
  getSpeciesAliasesFromFile,
  getVesselsDataFromFile,
  loadConversionFactorsFromLocalFile,
  loadSpeciesAliasesFromLocalFile,
  loadVesselsDataFromLocalFile
} from "../../src/data/local-file";
import * as file from "../../src/data/local-file";
import logger from "../../src/logger";

describe('get conversion factors', () => {

  it('should throw and log an error if file does not exist', async () => {
    await expect(() => getConversionFactors('should throw error')).rejects.toThrow('Error: File does not exist. Check to make sure the file path to your csv is correct.');
  });

  it('should return an array conversion factor object', async () => {
    const filePath = `${__dirname}/../../data/conversionfactors.csv`;

    const result = await getExporterBehaviourFromCSV(filePath);
    expect(result).toHaveLength(1883);
  });

});

describe('Load conversion factors', () => {
  let  mockGetConversionFactors: jest.SpyInstance, mockLoggerInfo: jest.SpyInstance, mockLoggerError: jest.SpyInstance;

  beforeEach(() => {
      mockGetConversionFactors = jest.spyOn(file, 'getConversionFactors');
      mockLoggerInfo = jest.spyOn(logger, 'info');
      mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
      jest.restoreAllMocks();
  });

  it('should call insert many with the right params', async () => {
      await loadConversionFactorsFromLocalFile();
      expect(mockLoggerInfo).toHaveBeenCalledWith('[CONVERSION-FACTORS][LOAD-CONVERSION-FACTORS][1883]');
  });


  it('should not insert any factors', async () => {
    mockGetConversionFactors.mockResolvedValue(undefined);

    await loadConversionFactorsFromLocalFile();
    expect(mockLoggerInfo).toHaveBeenCalledWith('[CONVERSION-FACTORS][LOAD-CONVERSION-FACTORS][0]');
});

  it('will log an error message', async () => {
    mockGetConversionFactors.mockRejectedValue(new Error('something went wrong'));
    const result = await loadConversionFactorsFromLocalFile();
    expect(mockLoggerError).toHaveBeenCalledWith('[CONVERSION-FACTORS][LOAD-CONVERSION-FACTORS][ERROR][Error: something went wrong]');
    expect(result).toBeUndefined();
  })

});

describe('loadSpeciesAliasesFromLocalFile', () => {
  const speciesAliasesData: any = [
    {
      "speciesName": "Monkfish",
      "speciesCode": "MON",
      "speciesAlias": ["ANF"]
    },
    {
      "speciesName": "Anglerfish",
      "speciesCode": "ANF",
      "speciesAlias": ["MON"]
    },
    {
      "speciesName": "Megrim",
      "speciesCode": "MEG",
      "speciesAlias": ["LEZ"]
    },
    {
      "speciesName": "Megrim",
      "speciesCode": "LEZ",
      "speciesAlias": ["MEG"]
    },
    {
      "speciesName": "Cuttlefish",
      "speciesCode": "CTL",
      "speciesAlias": ["CTC"]
    },
    {
      "speciesName": "Squid",
      "speciesCode": "SQC",
      "speciesAlias": ["SQR", "SQZ", "SQI"]
    },
    {
      "speciesName": "Squid",
      "speciesCode": "SQR",
      "speciesAlias": ["SQC", "SQZ", "SQI"]
    },
  ];
  
  let mockgetSpeciesAliasesFromFile: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;

  beforeEach(() => {
    mockgetSpeciesAliasesFromFile = jest.spyOn(file, 'getSpeciesAliasesFromFile');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will return species aliases data from local file', () => {
    mockgetSpeciesAliasesFromFile.mockReturnValue(speciesAliasesData);

    const expected: any = {
      ANF: ['MON'],
      CTL: ['CTC'],
      LEZ: ['MEG'],
      MEG: ['LEZ'],
      MON: ['ANF'],
      SQC: ['SQR', 'SQZ', 'SQI'],
      SQR: ['SQC', 'SQZ', 'SQI'],
    };

    const result: any = loadSpeciesAliasesFromLocalFile();

    expect(result).toStrictEqual(expected);
  });

  it('will log an error and return {} read from speciesmismatch file if there is an error', () => {
    const error = new Error('something went wrong');

    mockgetSpeciesAliasesFromFile.mockImplementation(() => {
      throw error;
    });

    const result = loadSpeciesAliasesFromLocalFile();

    expect(mockLoggerError).toHaveBeenCalledWith(error);
    expect(result).toStrictEqual({});
  });

})

describe('loadVesselsDataFromLocalFile', () => {

  let mockGetVesselData;
  let mockLoggerError;

  beforeEach(() => {
    mockGetVesselData = jest.spyOn(file, 'getVesselsDataFromFile');
    mockLoggerError = jest.spyOn(logger, 'error');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('will call getVesselDataFromFile in file storage', async () => {
    mockGetVesselData.mockResolvedValue('test');

    await loadVesselsDataFromLocalFile();

    expect(mockGetVesselData).toHaveBeenCalled();
  });

  it('will return data from file storage', async () => {
    mockGetVesselData.mockResolvedValue('test');

    const result = await loadVesselsDataFromLocalFile();

    expect(result).toBe('test');
  });

  it('will log an error and return void if file storage throws an error', async () => {

    mockGetVesselData.mockImplementation(() => {
      throw 'something went wrong'
    });

    const result = await loadVesselsDataFromLocalFile();

    expect(mockLoggerError).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

});

describe('get exporter behaviour csv', () => {

  it('should throw and log an error if file does not exist', async () => {
    await expect(() => getExporterBehaviourFromCSV('should throw error')).rejects.toThrow('Error: File does not exist. Check to make sure the file path to your csv is correct.');
  });

  it('should return an array of exporter behaviour objects', async () => {
    const filePath = `${__dirname}/../../data/exporter_behaviour.csv`;

    const result = await getExporterBehaviourFromCSV(filePath);
    expect(result).toHaveLength(1170);
  });

});

describe('get vessels of interest', () => {
  const filePath = `${__dirname}/../../data/vesselsOfInterest.csv`;

  it('should throw and log an error if file does not exist', async () => {
    await expect(() => getVesselsOfInterestFromFile('should throw error')).rejects.toThrow('Error: File does not exist. Check to make sure the file path to your csv is correct.');
  });

  it('should return an array of vessels of interests', async () => {
    const result = await getVesselsOfInterestFromFile(filePath);
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      "__t": 'vesselOfInterest',
      registrationNumber: expect.any(String)
    });
  });

});

describe('get weighting risk factors', () => {
  it('should throw and log an error if file does not exist', async () => {
    await expect(() => getWeightingRiskFromFile('should throw error')).rejects.toThrow('Error: File does not exist. Check to make sure the file path to your csv is correct.');
  });

  it('should return an array of weighting rick factors', async () => {
    const filePath = `${__dirname}/../../data/weightingRisk.csv`;
    const result = await getWeightingRiskFromFile(filePath);
    expect(result).toBeInstanceOf(Array);
    expect(result[0]).toMatchObject({
      vesselWeight: expect.any(Number),
      speciesWeight: expect.any(Number),
      exporterWeight: expect.any(Number),
      threshold: expect.any(Number)
    });
  });

});

describe('get species aliases from file', () => {

  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;
  let mockReadFileSync: jest.SpyInstance;

  beforeEach(() => {
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
    mockReadFileSync = jest.spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
    mockReadFileSync.mockRestore();
  });

  it('should throw and log an error if file does not exist', () => {
    const filePath = 'pathToNonExistingFile';

    mockReadFileSync.mockImplementation(() => {
      throw new Error("parse error")
    });

    expect(() => getSpeciesAliasesFromFile(filePath)).toThrow('parse error');
    expect(mockLoggerError).toHaveBeenCalledWith('Could not load species aliases data from file', filePath);
  });

  it('should return an array of species aliases', () => {
    const filePath = `${__dirname}/../../data/speciesmismatch.json`;

    const result = getSpeciesAliasesFromFile(filePath);
    expect(result).toBeInstanceOf(Array);
    expect(result).toHaveLength(20);
  });
});

describe('When getting vessels from a local file', () => {
  const path = `${__dirname}/../../data/vessels.json`;
  const expected: IVessel[] = [
    {
      "fishingVesselName": "MARLENA",
      "ircs": null,
      "flag": "GBR",
      "homePort": "WESTRAY",
      "registrationNumber": "K529",
      "imo": null,
      "fishingLicenceNumber": "30117",
      "fishingLicenceValidFrom": "2006-06-07T00:00:00",
      "fishingLicenceValidTo": "2006-06-30T00:00:00",
      "adminPort": "STORNOWAY",
      "rssNumber": "A12032",
      "vesselLength": 8.84,
      "cfr": "GBRA12032",
      "licenceHolderName": "I am the Licence Holder name for this fishing boat"
    }
  ];

  let mockLoggerInfo: jest.SpyInstance;
  let mockLoggerError: jest.SpyInstance;
  let mockReadFileSync: jest.SpyInstance;

  beforeEach(() => {
    mockLoggerInfo = jest.spyOn(logger, 'info');
    mockLoggerError = jest.spyOn(logger, 'error');
    mockReadFileSync = jest.spyOn(fs, 'readFileSync');
  });

  afterEach(() => {
    mockLoggerInfo.mockRestore();
    mockLoggerError.mockRestore();
    mockReadFileSync.mockRestore();
  });

  it('will return the data for export vessels from file', () => {
    mockReadFileSync.mockReturnValue(JSON.stringify(expected));
    const vessels = getVesselsDataFromFile(path);

    expect(mockReadFileSync).toHaveBeenCalledWith(path, "utf-8");
    expect(vessels).toEqual(expected);
  });

  it('will return an error if getVesselsFromLocalFile throws a parse error', () => {
    mockReadFileSync.mockImplementation(() => {
      throw new Error("parse error")
    });

    expect(() => getVesselsDataFromFile(path)).toThrow('parse error');
    expect(mockLoggerError).toHaveBeenCalledWith('Could not load vessels data from file', path);
  });

});

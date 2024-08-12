import { IConversionFactor, IExporterBehaviour, IVessel, IVesselOfInterest, IWeighting, WEIGHT } from 'mmo-shared-reference-data';
import * as blob from '../../src/data/blob-storage';
import * as file from '../../src/data/local-file';
import * as SUT from '../../src/data/cache';
import * as risking from '../../src/landings/persistence/risking';
import appConfig from '../../src/config'
import logger from '../../src/logger';

describe('loadFishCountriesAndSpecies', () => {

  const speciesAliasesData: any = [
    {
      speciesName: "Monkfish",
      speciesCode: "MON",
      speciesAlias: ["ANF"]
    },
    {
      speciesName: "Anglerfish",
      speciesCode: "ANF",
      speciesAlias: ["MON"]
    },
    {
      speciesName: "Megrim",
      speciesCode: "MEG",
      speciesAlias: ["LEZ"]
    },
    {
      speciesName: "Megrim",
      speciesCode: "LEZ",
      speciesAlias: ["MEG"]
    },
    {
      speciesName: "Cuttlefish",
      speciesCode: "CTL",
      speciesAlias: ["CTC"]
    },
    {
      speciesName: "Squid",
      speciesCode: "SQC",
      speciesAlias: ["SQR", "SQZ", "SQI"]
    },
    {
      speciesName: "Squid",
      speciesCode: "SQR",
      speciesAlias: ["SQC", "SQZ", "SQI"]
    },
  ];

  const vesselsOfInterestData: IVesselOfInterest[] = [{
    registrationNumber: 'H1100', fishingVesselName: 'WIRON 5', homePort: 'PLYMOUTH', da: 'England'
  }, {
    registrationNumber: 'NN732', fishingVesselName: 'CLAR INNIS', homePort: 'EASTBOURNE', da: 'England'
  }, {
    registrationNumber: 'RX1', fishingVesselName: 'JOCALINDA', homePort: 'RYE', da: 'England'
  }, {
    registrationNumber: 'SM161', fishingVesselName: 'JUST REWARD', homePort: 'WORTHING', da: 'England'
  }];

  const weightingRiskData: IWeighting = {
    exporterWeight: 1,
    vesselWeight: 1,
    speciesWeight: 1,
    threshold: 1
  }

  describe('loadLocalFishCountriesAndSpecies', () => {
    let mockLoadSpeciesAliases: jest.SpyInstance;
    let mockLoadConversionFactors: jest.SpyInstance;
    let mockSeedWeightingRisk: jest.SpyInstance;
    let mockSeedVesselsOfInterest: jest.SpyInstance;
    let mockLoggerInfo: jest.SpyInstance;
  
    beforeEach(() => {
      appConfig.inDev = true;
  
      mockLoadSpeciesAliases = jest.spyOn(file, 'loadSpeciesAliasesFromLocalFile');
      mockLoadConversionFactors = jest.spyOn(file, 'loadConversionFactorsFromLocalFile');
      mockSeedWeightingRisk = jest.spyOn(risking, 'seedWeightingRisk')
      mockSeedVesselsOfInterest = jest.spyOn(risking, 'seedVesselsOfInterest');
      mockLoggerInfo = jest.spyOn(logger, 'info');
  
      mockLoadSpeciesAliases.mockReturnValue(speciesAliasesData);
      mockLoadConversionFactors.mockResolvedValue([]);
      mockSeedVesselsOfInterest.mockResolvedValue(vesselsOfInterestData);
      mockSeedWeightingRisk.mockResolvedValue(weightingRiskData);
    });
  
    afterEach(() => {
      jest.restoreAllMocks();
  
      SUT.updateConversionFactorCache([]);
      SUT.updateSpeciesAliasesCache([]);
      SUT.updateVesselsOfInterestCache([]);
      SUT.updateWeightingCache({
        exporterWeight: 0,
        vesselWeight: 0,
        speciesWeight: 0,
        threshold: 0
      });
    });
  
    it('should call all data related methods', async () => {
      await SUT.loadFishCountriesAndSpecies();
  
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][Loading data from local files in dev mode]')
      expect(mockLoadSpeciesAliases).toHaveBeenCalled();
      expect(mockLoadConversionFactors).toHaveBeenCalled();
      expect(mockSeedWeightingRisk).toHaveBeenCalled();
      expect(mockSeedVesselsOfInterest).toHaveBeenCalled();
    });
  });

  describe('loadProdFishCountriesAndSpecies', () => {
    let mockLoadSpeciesAliases: jest.SpyInstance;
    let mockLoadConversionFactors: jest.SpyInstance;
    let mockGetWeightingRisk: jest.SpyInstance;
    let mockGetVesselsOfInterest: jest.SpyInstance;
    let mockLoggerInfo: jest.SpyInstance;
  
    beforeEach(() => {
      appConfig.inDev = false;
  
      mockLoadSpeciesAliases = jest.spyOn(blob, 'getSpeciesAliasesFromBlob');
      mockLoadConversionFactors = jest.spyOn(blob, 'getConversionFactorsData');
      mockGetWeightingRisk = jest.spyOn(risking, 'getWeightingRisk')
      mockGetVesselsOfInterest = jest.spyOn(risking, 'getVesselsOfInterest');
      mockLoggerInfo = jest.spyOn(logger, 'info');
  
      mockLoadSpeciesAliases.mockReturnValue(speciesAliasesData);
      mockLoadConversionFactors.mockResolvedValue([]);
      mockGetVesselsOfInterest.mockResolvedValue(vesselsOfInterestData);
      mockGetWeightingRisk.mockResolvedValue(weightingRiskData);
    });
  
    afterEach(() => {
      jest.restoreAllMocks();
  
      SUT.updateConversionFactorCache([]);
      SUT.updateSpeciesAliasesCache([]);
      SUT.updateVesselsOfInterestCache([]);
      SUT.updateWeightingCache({
        exporterWeight: 0,
        vesselWeight: 0,
        speciesWeight: 0,
        threshold: 0
      });
    });
  
    it('should call all data related methods', async () => {
      await SUT.loadFishCountriesAndSpecies();
  
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][Loading data from blob storage in production mode]')
      expect(mockLoadSpeciesAliases).toHaveBeenCalled();
      expect(mockLoadConversionFactors).toHaveBeenCalled();
      expect(mockGetWeightingRisk).toHaveBeenCalled();
      expect(mockGetVesselsOfInterest).toHaveBeenCalled();
    });

    it('should throw an error if one found reading species aliases', async () => {
      mockLoadSpeciesAliases.mockRejectedValue(new Error('can\'t read from storage'));

      await expect(SUT.loadFishCountriesAndSpecies()).rejects.toThrow();
  
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][Loading data from blob storage in production mode]')
      expect(mockLoadSpeciesAliases).toHaveBeenCalled();
      expect(mockLoadConversionFactors).not.toHaveBeenCalled();
      expect(mockGetWeightingRisk).not.toHaveBeenCalled();
      expect(mockGetVesselsOfInterest).not.toHaveBeenCalled();
    });

    it('should throw an error if one found reading conversion factors', async () => {
      mockLoadConversionFactors.mockRejectedValue(new Error('can\'t read from storage'));
      
      await expect(SUT.loadFishCountriesAndSpecies()).rejects.toThrow();
  
      expect(mockLoggerInfo).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][Loading data from blob storage in production mode]')
      expect(mockLoadSpeciesAliases).toHaveBeenCalled();
      expect(mockLoadConversionFactors).toHaveBeenCalled();
      expect(mockGetWeightingRisk).not.toHaveBeenCalled();
      expect(mockGetVesselsOfInterest).not.toHaveBeenCalled();
    });
  });
});

describe('loadVessels', () => {
  let mockVesselsData: jest.SpyInstance;

  beforeEach(() => {
    mockVesselsData = jest.spyOn(blob, 'getVesselDateFromBlob');
    mockVesselsData.mockResolvedValue(undefined);
  });

  afterEach(() => {
    mockVesselsData.mockRestore();
  });

  it('should not call load vesssel data when in dev', async () => {
    appConfig.inDev = true;

    await SUT.loadVessels();
    expect(mockVesselsData).not.toHaveBeenCalled();
  });

  it('should call load vesssel data when in dev', async () => {
    appConfig.inDev = false;
    appConfig.blobStorageConnection = 'blah!';

    await SUT.loadVessels();
    expect(mockVesselsData).toHaveBeenCalledWith('blah!');
  });

  it('should throw an error from blob', async () => {
    appConfig.inDev = false;
    appConfig.blobStorageConnection = 'blah!';

    mockVesselsData.mockRejectedValue(new Error('something has gone wrong'))

    await expect(SUT.loadVessels()).rejects.toThrow();
  });

});

describe('getVessesData', () => {
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

  it('will get the list of cached vessels', () => {
    SUT.updateVesselsCache(vesselData);
    expect(SUT.getVesselsData()).toHaveLength(3);
  });

  it('will return the rssNumber \'A12032\' for the pln \'K529\'', () => {
    SUT.updateVesselsCache(vesselData);
    expect(SUT.getVesselsIdx()('K529')).toHaveLength(1);
    expect(SUT.getVesselsIdx()('K529')[0].rssNumber).toBe('A12032');
  });
});

describe('getSpeciesAliases', () => {

  const mockSpeciesAliases: any = {
    ANF: ['MON'],
    CTL: ['CTC'],
    LEZ: ['MEG'],
    MEG: ['LEZ'],
    MON: ['ANF'],
    SQC: ['SQR', 'SQZ', 'SQI'],
    SQR: ['SQC', 'SQZ', 'SQI']
  };

  beforeEach(() => {
    SUT.updateSpeciesAliasesCache(mockSpeciesAliases);
  });

  it('should return species aliases', () => {
    const speciesAliases = SUT.getSpeciesAliases('SQC');
    const expected = ['SQR', 'SQZ', 'SQI'];
    expect(speciesAliases).toEqual(expected);
  });

  it('should return an empty array if no species code passed in', () => {
    const speciesAliases = SUT.getSpeciesAliases('');
    expect(speciesAliases).toEqual([]);
  });

  it('should return empty array if there is no species aliases', () => {
    const speciesAliases = SUT.getSpeciesAliases('COD');
    expect(speciesAliases).toEqual([]);
  });
});

describe('loadExporterBehaviour', () => {

  let mockLoadBlob: jest.SpyInstance;
  let mockLoadLocal: jest.SpyInstance;

  beforeEach(() => {
    mockLoadBlob = jest.spyOn(SUT, 'loadExporterBehaviourFromAzureBlob');
    mockLoadLocal = jest.spyOn(SUT, 'loadExporterBehaviourFromLocalFile');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('if in dev mode will call loadExporterBehaviourFromLocalFile', async () => {
    mockLoadLocal.mockResolvedValue(null);

    appConfig.inDev = true;

    await SUT.loadExporterBehaviour();

    expect(mockLoadLocal).toHaveBeenCalled();
  });

  it('if not in dev mode will call loadExporterBehaviourFromAzureBlob', async () => {
    mockLoadBlob.mockResolvedValue(null);

    appConfig.inDev = false;

    await SUT.loadExporterBehaviour();

    expect(mockLoadBlob).toHaveBeenCalled();
  });

});

describe('loadExporterBehaviourFromLocalFile', () => {

  let mockGetExporterBehaviourFromCSV: jest.SpyInstance;
  let mockLogError: jest.SpyInstance;

  beforeEach(() => {
    mockGetExporterBehaviourFromCSV = jest.spyOn(file, 'getExporterBehaviourFromCSV');
    mockLogError = jest.spyOn(logger, 'error');
  });

  it('will call and return the result from file.getExporterBehaviourFromCSV', async () => {
    const data = [
      { accountId: 'ID1', name: 'Exporter 1', score: 0 },
      { accountId: 'ID2', name: 'Exporter 2', score: 0.5 }
    ];

    mockGetExporterBehaviourFromCSV.mockResolvedValue(data);

    const result = await SUT.loadExporterBehaviourFromLocalFile();

    expect(result).toBe(data);
  });

  it('will handle any errors from file.getExporterBehaviourFromCSV and return an empty array', async () => {
    const error = new Error('boom');

    mockGetExporterBehaviourFromCSV.mockRejectedValue(error);

    const result = await SUT.loadExporterBehaviourFromLocalFile();

    expect(result).toEqual([]);
    expect(mockLogError).toHaveBeenNthCalledWith(1, error);
  });

});

describe('loadExporterBehaviourFromAzureBlob', () => {

  let mockGetExporterBehaviourData: jest.SpyInstance;
  let mockLogInfo: jest.SpyInstance;

  beforeEach(() => {
    mockGetExporterBehaviourData = jest.spyOn(blob, 'getExporterBehaviourData');
    mockLogInfo = jest.spyOn(logger, 'info');
  });

  afterEach(() => {
    mockLogInfo.mockRestore();
  });

  it('will call and return the result from blob.getExporterBehaviourData', async () => {
    const data = [
      { accountId: 'ID1', name: 'Exporter 1', score: 0 },
      { accountId: 'ID2', name: 'Exporter 2', score: 0.5 }
    ];

    mockGetExporterBehaviourData.mockResolvedValue(data);

    const result = await SUT.loadExporterBehaviourFromAzureBlob('connStr');

    expect(result).toBe(data);
    expect(mockLogInfo).toHaveBeenCalledWith('[BLOB-STORAGE-DATA-LOAD][EXPORTER-BEHAVIOUR]');
  });

  it('will rethrow any errors from blob.getExporterBehaviourData', async () => {
    const error = new Error('boom');

    mockGetExporterBehaviourData.mockRejectedValue(error);

    await expect(SUT.loadExporterBehaviourFromAzureBlob('connStr'))
      .rejects
      .toThrow(new Error(`[BLOB-STORAGE-LOAD-ERROR][EXPORTER-BEHAVIOUR] ${error}`));
  });

});

describe('getExporterRiskScore', () => {

  const testExporters: IExporterBehaviour[] = [
    { name: 'Organisation 1, Contact 1', accountId: 'acc1', contactId: 'con1', score: 0.9 },
    { name: 'Organisation 1, Contact 2', accountId: 'acc1', contactId: 'con2', score: 0.7 },
    { name: 'Organisation 1, Contact 3', contactId: 'con3', score: 0.8 },
    { name: 'Organisation 1, All Other Contacts', accountId: 'acc1', score: 0.3 },
    { name: 'Individual fisherman', contactId: 'con2', score: 0.2 },
  ];

  beforeAll(async () => {
    appConfig.inDev = true;

    jest.spyOn(SUT, 'loadExporterBehaviourFromLocalFile')
      .mockResolvedValue(testExporters);

    await SUT.loadExporterBehaviour();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('will return a default of 1.0 if no ids are provided', () => {
    const score = SUT.getExporterRiskScore(null, null);

    expect(score).toBe(1.0);
  });

  describe('for an individual user (no accountId)', () => {

    it('will find an individual fisherman by contactId only', () => {
      const score = SUT.getExporterRiskScore(null, 'con2');

      expect(score).toBe(0.2);
    });

    it('will return a default of 1.0 if no match is found', () => {
      const score = SUT.getExporterRiskScore(null, 'xx');

      expect(score).toBe(1.0);
    });

  });

  describe('for a user within an organisation (has an accountId)', () => {

    it('will use both ids to find an exact match', () => {
      const score = SUT.getExporterRiskScore('acc1', 'con2');

      expect(score).toBe(0.7);
    });

    it('will match on contactId if no exact match', () => {
      const score = SUT.getExporterRiskScore('acc1', 'con3');

      expect(score).toBe(0.8);
    });

    it('will match on accountId if no contact match', () => {
      const score = SUT.getExporterRiskScore('acc1', 'con99');

      expect(score).toBe(0.3);
    });

    it('will return a default of 1.0 if no match is found', () => {
      const score = SUT.getExporterRiskScore('xx', 'xx');

      expect(score).toBe(1.0);
    });

  });

});

describe('getVesselRiskScore', () => {
  
  const vesselsOfInterestData: IVesselOfInterest[] = [{
    registrationNumber: 'H1100', fishingVesselName: 'WIRON 5', homePort: 'PLYMOUTH', da: 'England'
  }, {
    registrationNumber: 'NN732', fishingVesselName: 'CLAR INNIS', homePort: 'EASTBOURNE', da: 'England'
  }, {
    registrationNumber: 'RX1', fishingVesselName: 'JOCALINDA', homePort: 'RYE', da: 'England'
  }, {
    registrationNumber: 'SM161', fishingVesselName: 'JUST REWARD', homePort: 'WORTHING', da: 'England'
  }];

  beforeEach(() => {
    SUT.updateVesselsOfInterestCache(vesselsOfInterestData);
  });

  afterEach(() => {
    SUT.updateVesselsOfInterestCache([]);
  });

  it('returns a score of 1 if the vessel is present within the vessels of interest list', async () => {
    const pln: string = 'H1100';
    const result = SUT.getVesselRiskScore(pln);
    expect(result).toBe(1);
  });

  it('return a score of 0.5 if the vessel is not present within the vessels of interest list', async () => {
    const pln: string = 'WA1';
    const result = SUT.getVesselRiskScore(pln);
    expect(result).toBe(0.5);
  });

});

describe('getWeighting', () => {
  const weightingRiskData: IWeighting = {
    exporterWeight: 1,
    vesselWeight: 1,
    speciesWeight: 1,
    threshold: 1
  }
  
  beforeAll(() => {
    SUT.updateWeightingCache(weightingRiskData);
  });

  afterAll(() => {
    SUT.updateWeightingCache({
      exporterWeight: 0,
      speciesWeight: 0,
      vesselWeight: 0,
      threshold: 0
    });
  });

  it('will return the correct weighting', () => {
    expect(SUT.getWeighting(WEIGHT.EXPORTER)).toBe(1);
    expect(SUT.getWeighting(WEIGHT.VESSEL)).toBe(1);
    expect(SUT.getWeighting(WEIGHT.SPECIES)).toBe(1);
  });

  it('will return the correct risk thres hold', () => {
    expect(SUT.getRiskThreshold()).toBe(1);
  });
});

describe('getSpeciesRiskScore', () => {

  let mockConversionFactors: IConversionFactor[] = [];

  beforeEach(() => {
    mockConversionFactors = [
      {
        species: 'COD',
        state: 'FRE',
        presentation: 'FRO',
        toLiveWeightFactor: undefined,
        quotaStatus: 'quota',
        riskScore: 1
      },
      {
        species: 'HER',
        state: 'FRE',
        presentation: 'FIL',
        toLiveWeightFactor: 1.2,
        quotaStatus: 'quota',
        riskScore: 1
      },
      {
        species: 'ALB',
        state: 'FRE',
        presentation: 'FIL',
        toLiveWeightFactor: undefined,
        quotaStatus: 'quota',
        riskScore: 1
      },
      {
        species: 'LBE',
        state: 'FRO',
        presentation: 'WHO',
        toLiveWeightFactor: 1.5,
        quotaStatus: 'nonquota',
        riskScore: 1
      },
      {
        species: 'WHO',
        state: 'FRE',
        presentation: 'WHO',
        quotaStatus: 'quota',
        riskScore: 1,
        toLiveWeightFactor: null
      },
      {
        species: 'COD',
        state: 'FRE',
        presentation: 'FIL',
        toLiveWeightFactor: 1.2,
        quotaStatus: 'quota',
        riskScore: 1
      },
      {
        species: 'BOB',
        state: 'FRE',
        presentation: 'FIL',
        toLiveWeightFactor: 1.2,
        quotaStatus: 'quota',
        riskScore: undefined
      }
    ];

    SUT.updateConversionFactorCache(mockConversionFactors);
  });

  it('should return default value when undefined riskScore', () => {
    const speciesRisk = SUT.getSpeciesRiskScore('COD');
    expect(speciesRisk).toBe(1);
  });

  it('should return default value when missing riskScore', () => {
    const speciesRisk = SUT.getSpeciesRiskScore('WHO');
    expect(speciesRisk).toBe(1);
  });

  it('should return riskScore value when riskScore is a number', () => {
    const speciesRisk = SUT.getSpeciesRiskScore('LBE');
    expect(speciesRisk).toBe(1);
  });

  it('should return riskScore value when riskScore is a string valid number', () => {
    const speciesRisk = SUT.getSpeciesRiskScore('HER');
    expect(speciesRisk).toBe(1);
  });

  it('should return default value when riskScore string is a string not valid number', () => {
    const speciesRisk = SUT.getSpeciesRiskScore('ALB');
    expect(speciesRisk).toBe(1);
  });

  it('should return default value when species data does not exist', () => {
    const speciesRisk = SUT.getSpeciesRiskScore('NOSPECIESDATA');
    expect(speciesRisk).toBe(0.5);
  });

});

describe('Refresh Risking Data', () => {

  const vesselsOfInterestData: IVesselOfInterest[] = [{
    registrationNumber: 'H1100', fishingVesselName: 'WIRON 5', homePort: 'PLYMOUTH', da: 'England'
  }, {
    registrationNumber: 'NN732', fishingVesselName: 'CLAR INNIS', homePort: 'EASTBOURNE', da: 'England'
  }, {
    registrationNumber: 'RX1', fishingVesselName: 'JOCALINDA', homePort: 'RYE', da: 'England'
  }, {
    registrationNumber: 'SM161', fishingVesselName: 'JUST REWARD', homePort: 'WORTHING', da: 'England'
  }];
  
  const weightingRiskData: IWeighting = {
    exporterWeight: 1,
    vesselWeight: 1,
    speciesWeight: 1,
    threshold: 1
  }

  let mockGetVesselsOfInterest: jest.SpyInstance;
  let mockUpdateVesselsOfInterestCache: jest.SpyInstance;
  let mockGetWeightingRisk: jest.SpyInstance;
  let mockUpdateWeightingCache: jest.SpyInstance;

  beforeEach(() => {
    mockGetVesselsOfInterest = jest.spyOn(risking, 'getVesselsOfInterest');
    mockGetWeightingRisk = jest.spyOn(risking, 'getWeightingRisk');

    mockUpdateVesselsOfInterestCache = jest.spyOn(SUT, 'updateVesselsOfInterestCache');
    mockUpdateWeightingCache = jest.spyOn(SUT, 'updateWeightingCache');
   

    mockGetVesselsOfInterest.mockResolvedValue(vesselsOfInterestData);
    mockGetWeightingRisk.mockResolvedValue(weightingRiskData);
  });

  afterEach(() => {
    SUT.updateVesselsOfInterestCache([]);
    SUT.updateWeightingCache({
      exporterWeight: 0,
      vesselWeight: 0,
      speciesWeight: 0,
      threshold: 0
    });
  
    mockGetVesselsOfInterest.mockRestore();
    mockUpdateVesselsOfInterestCache.mockRestore();

    mockGetWeightingRisk.mockRestore();
    mockUpdateWeightingCache.mockRestore();
  });

  it('should refresh the vessels of interest', async () => {
    await SUT.refreshRiskingData();

    expect(mockGetVesselsOfInterest).toHaveBeenCalled();
    expect(mockUpdateVesselsOfInterestCache).toHaveBeenCalledWith(vesselsOfInterestData);

    expect(mockGetWeightingRisk).toHaveBeenCalled();
    expect(mockUpdateWeightingCache).toHaveBeenCalledWith(weightingRiskData);

    expect(SUT.getVesselRiskScore('H1100')).toBe(1);
    expect(SUT.getVesselRiskScore('WA1')).toBe(0.5);

    expect(SUT.getWeighting(WEIGHT.VESSEL)).toBe(1);
    expect(SUT.getWeighting(WEIGHT.SPECIES)).toBe(1);
    expect(SUT.getWeighting(WEIGHT.EXPORTER)).toBe(1);
    expect(SUT.getRiskThreshold()).toBe(1);
  });

  it('should return a vesselIdx for K529', () => {
    expect(SUT.getVesselsIdx()('K529')).toHaveLength(1);
  });

  it('should return vessels data', () => {
    expect(SUT.getVesselsData()).toHaveLength(3);
  });
});
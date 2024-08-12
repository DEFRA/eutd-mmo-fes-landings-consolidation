import appConfig from '../config';
import { IConversionFactor, IExporterBehaviour, IVessel, IVesselOfInterest, IWeighting, WEIGHT, generateIndex } from 'mmo-shared-reference-data';
import { getVesselDateFromBlob, getExporterBehaviourData, getSpeciesAliasesFromBlob, getConversionFactorsData } from './blob-storage';
import { getExporterBehaviourFromCSV, loadSpeciesAliasesFromLocalFile, loadConversionFactorsFromLocalFile, loadVesselsDataFromLocalFile } from './local-file';
import { getVesselsOfInterest, getWeightingRisk, seedVesselsOfInterest, seedWeightingRisk } from '../landings/persistence/risking';
import logger from '../logger';

let VESSELS: IVessel[] = [];
let VESSELS_IDX: (pln: string) => any;
let VESSELS_OF_INTEREST: IVesselOfInterest[] = [];
let CONVERSION_FACTORS: IConversionFactor[] = [];
let EXPORTER_BEHAVIOUR: IExporterBehaviour[] = [];
let SPECIES_ALIASES: any = {};
let WEIGHTING: IWeighting = {
  exporterWeight: 0,
  vesselWeight: 0,
  speciesWeight: 0,
  threshold: 0
};

export const loadLocalFishCountriesAndSpecies = async () => {
  logger.info('[LANDINGS-CONSOLIDATION][Loading data from local files in dev mode]');

  const speciesAliases = loadSpeciesAliasesFromLocalFile();
  const factors = await loadConversionFactorsFromLocalFile();
  const vesselsOfInterest = await seedVesselsOfInterest();
  const weightingRisk = await seedWeightingRisk();

  updateConversionFactorCache(factors);
  updateSpeciesAliasesCache(speciesAliases);
  updateVesselsOfInterestCache(vesselsOfInterest);
  updateWeightingCache(weightingRisk);
}

export const loadProdFishCountriesAndSpecies = async () => {
  logger.info('[LANDINGS-CONSOLIDATION][Loading data from blob storage in production mode]');

  const blobStorageConnStr = appConfig.blobStorageConnection;

  const speciesAliases = await loadSpeciesAliases(blobStorageConnStr);
  const factors = await loadConversionFactorsData(blobStorageConnStr);
  const vesselsOfInterest = await getVesselsOfInterest();
  const weightingRisk = await getWeightingRisk();

  updateSpeciesAliasesCache(speciesAliases);
  updateConversionFactorCache(factors);
  updateVesselsOfInterestCache(vesselsOfInterest);
  updateWeightingCache(weightingRisk);
}

export const refreshRiskingData = async () => {
  const vesselsOfInterest = await getVesselsOfInterest();
  const weightingRisk = await getWeightingRisk();
  
  updateVesselsOfInterestCache(vesselsOfInterest);
  updateWeightingCache(weightingRisk);

  logger.info('[LANDING-CONSOLIDATION][REFRESH-RISKING-DATA][SUCCESS]');
};

export const loadFishCountriesAndSpecies = async () =>
  (appConfig.inDev) ? loadLocalFishCountriesAndSpecies() : loadProdFishCountriesAndSpecies();

export const loadVessels = async () => {
  let vessels = undefined;
  if (appConfig.inDev) {
    vessels = await loadVesselsDataFromLocalFile();
  } else {
    const blobStorageConnStr = appConfig.blobStorageConnection;
    vessels = await loadVesselsData(blobStorageConnStr);
  }

  updateVesselsCache(vessels);
}

export const loadVesselsData = async (blobConnStr: string): Promise<IVessel[] | undefined> => {
  try {
    logger.info('[BLOB-STORAGE-DATA-LOAD][VESSELS]');
    return await getVesselDateFromBlob(blobConnStr);
  } catch (e) {
    throw new Error(`[BLOB-STORAGE-LOAD-ERROR][VESSELS] ${e}`)
  }
}

export const loadExporterBehaviour = async () =>
  EXPORTER_BEHAVIOUR = (appConfig.inDev)
    ? await loadExporterBehaviourFromLocalFile()
    : await loadExporterBehaviourFromAzureBlob(appConfig.blobStorageConnection);

export const loadExporterBehaviourFromLocalFile = async (): Promise<IExporterBehaviour[]> => {
  const path = `${__dirname}/../../data/exporter_behaviour.csv`;
  try {
    return await getExporterBehaviourFromCSV(path);
  }
  catch (e) {
    logger.error(e);
    logger.error(`Cannot load exporter behaviour file from local file system, path: ${path}`);
    return [];
  }
};

export const loadExporterBehaviourFromAzureBlob = async (blobConnStr: string): Promise<IExporterBehaviour[]> => {
  try {
    logger.info('[BLOB-STORAGE-DATA-LOAD][EXPORTER-BEHAVIOUR]');
    return await getExporterBehaviourData(blobConnStr);
  }
  catch (e) {
    throw new Error(`[BLOB-STORAGE-LOAD-ERROR][EXPORTER-BEHAVIOUR] ${e}`);
  }
};

export const loadSpeciesAliases = async (blobConnStr: string): Promise<any> => {
  try {
    logger.info('[BLOB-STORAGE-DATA-LOAD][SPECIES-ALIASES]');
    return await getSpeciesAliasesFromBlob(blobConnStr);
  } catch (e) {
    throw new Error(`[BLOB-STORAGE-LOAD-ERROR][SPECIES-ALIASES] ${e}`)
  }
};

export const loadConversionFactorsData = async (blobConnStr: string): Promise<IConversionFactor[]> => {
  try {
    logger.info('[BLOB-STORAGE-DATA-LOAD][CONVERSION-FACTORS]');
    return await getConversionFactorsData(blobConnStr);
  } catch (e) {
    throw new Error(`[BLOB-STORAGE-LOAD-ERROR][CONVERSION-FACTORS] ${e}`)
  }
};

export const updateVesselsCache = (vessels: IVessel[] | undefined) => {
  if (Array.isArray(vessels)) {
    logger.info(`[LANDINGS-CONSOLIDATION][LOADING-VESSELS-INTO-CACHE][${vessels.length}]`);
    VESSELS = vessels;
    VESSELS_IDX = generateIndex(vessels);
  }
}

export const updateVesselsOfInterestCache = (vesselsOfInterest: IVesselOfInterest[]) => {
  if (Array.isArray(vesselsOfInterest)) {
    logger.info(`[LANDINGS-CONSOLIDATION][LOADING-VESSELS-OF-INTEREST-INTO-CACHE][${vesselsOfInterest.length}]`);
    VESSELS_OF_INTEREST = vesselsOfInterest;
  }
};

export const updateWeightingCache = (weighting: IWeighting) => {
  if (weighting) {
    logger.info(`[LANDINGS-CONSOLIDATION][LOADING-WEIGHTING-INTO-CACHE][${JSON.stringify(weighting)}]`);
    WEIGHTING = weighting;
  }
};

export const updateConversionFactorCache = (factors: IConversionFactor[]) => {
  if (Array.isArray(factors)) {
    logger.info(`[LANDINGS-CONSOLIDATION][LOADING-CONVERSION-FACTOR-INTO-CACHE][${factors.length}]`);
    CONVERSION_FACTORS = factors.map((factorData: IConversionFactor) => {
      return {
        species: factorData.species,
        state: factorData.state,
        presentation: factorData.presentation,
        toLiveWeightFactor: isNaN(factorData.toLiveWeightFactor) ? undefined : Number(factorData.toLiveWeightFactor),
        quotaStatus: factorData.quotaStatus,
        riskScore: isNaN(factorData.riskScore) ? undefined : Number(factorData.riskScore)
      }
    });
  }
}

export const updateSpeciesAliasesCache = (speciesAliases?: any | undefined) => {
  if (speciesAliases) {
    logger.info(`[LANDINGS-CONSOLIDATION][LOADING-SPECIES-ALIASES-INTO-CACHE][${Object.keys(speciesAliases).length}]`);
    SPECIES_ALIASES = speciesAliases;
  }
}

export const getVesselsData: () => IVessel[] = () => { return VESSELS };
export const getVesselsIdx: () => (pln: string) => any = () => { return VESSELS_IDX };
export const getRiskThreshold = (): number => WEIGHTING['threshold'];
export const getWeighting = (type: WEIGHT): number => WEIGHTING[type];
export const getVesselRiskScore = (pln: string) => VESSELS_OF_INTEREST.find((v: IVesselOfInterest) => v && v.registrationNumber === pln) ? 1 : 0.5;
export const getSpeciesRiskScore = (speciesCode: string) => {
  const speciesData = CONVERSION_FACTORS.find((f: IConversionFactor) => f.species === speciesCode);
  return speciesData && speciesData.riskScore !== undefined ? speciesData.riskScore : 0.5;
};
export const getExporterRiskScore = (accountId: string, contactId: string) => {

  const defaultScore = 1.0;

  if (!accountId && !contactId) {
    return defaultScore;
  }

  if (EXPORTER_BEHAVIOUR.length) {

    if (!accountId) {
      const individual = EXPORTER_BEHAVIOUR.find((e: IExporterBehaviour) => e.contactId === contactId && !e.accountId);

      if (individual)
        return individual.score;
    } else {
      const otherMatches = checkOtherMatches(accountId, contactId);
      if (otherMatches) {
        return otherMatches;
      }
    }
  }

  return defaultScore;

};
const checkOtherMatches = (accountId: string, contactId: string) => {
  const exactMatch = EXPORTER_BEHAVIOUR.find((e: IExporterBehaviour) => e.accountId === accountId && e.contactId === contactId);

  if (exactMatch) {
    return exactMatch.score;
  }

  const contactMatch = EXPORTER_BEHAVIOUR.find((e: IExporterBehaviour) => e.contactId === contactId && !e.accountId);

  if (contactMatch) {
    return contactMatch.score;
  }

  const accountMatch = EXPORTER_BEHAVIOUR.find((e: IExporterBehaviour) => e.accountId === accountId && !e.contactId);

  if (accountMatch) {
    return accountMatch.score;
  }
}
export const getSpeciesAliases = (speciesCode: string): string[] => SPECIES_ALIASES[speciesCode] ?? [];
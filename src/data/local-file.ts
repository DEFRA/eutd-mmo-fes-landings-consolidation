import fs from 'fs';
import csv from 'csvtojson';
import { IConversionFactor, IExporterBehaviour, IVessel, IVesselOfInterest, IWeighting } from 'mmo-shared-reference-data';
import logger from '../logger';

export const getVesselsDataFromFile = (vesselsFilePath: string): IVessel[] => {
  try {
    return JSON.parse(fs.readFileSync(vesselsFilePath, 'utf-8'));
  } catch(e) {
    logger.error('Could not load vessels data from file', vesselsFilePath);
    throw new Error(e);
  }
};

export const loadVesselsDataFromLocalFile = async (vesselFilePath?: string): Promise<IVessel[] | undefined> => {
  const path = vesselFilePath || `${__dirname}/../../data/vessels.json`;
  try {
    return getVesselsDataFromFile(path);
  } catch (e) {
    logger.error(e);
    logger.error(`Cannot load vessels file from local file system, path: ${path}`);
  }
}

export const getVesselsOfInterestFromFile = async (vesselsOfInterestFilePath: string): Promise<IVesselOfInterest[]> => {
  try {
    return await csv().fromFile(vesselsOfInterestFilePath);
  } catch(e) {
    logger.error('Could not load vessels of interest data from file', vesselsOfInterestFilePath);
    throw new Error(e);
  }
};

export const getWeightingRiskFromFile = async (weightingRiskFilePath: string): Promise<IWeighting[]> => {
  try {
    return await csv({
      colParser:{
      "vesselWeight":   "Number",
      "speciesWeight":  "Number",
      "exporterWeight": "Number",
      "threshold":      "Number"
      },
      delimiter: ','
    }).fromFile(weightingRiskFilePath);
  } catch(e) {
    logger.error('Could not load weighting risk data from file', weightingRiskFilePath);
    throw new Error(e);
  }
};

export const getExporterBehaviourFromCSV = async (exporterBehaviourFilePath: string): Promise<IExporterBehaviour[]> => {
  try {
    return await csv({
        colParser:{
          "accountId": "string",
          "contactId": "string",
          "name": "string",
          "score": "number",
        },
        delimiter: ',',
        ignoreEmpty: true
      })
      .fromFile(exporterBehaviourFilePath);
  }
  catch(e) {
    logger.error('Could not load exporter behaviour data from file', exporterBehaviourFilePath);
    throw new Error(e);
  }
};

export const getConversionFactors = async (conversionFactorsFilePath: string): Promise<IConversionFactor[]> => {
  try {
    return await csv().fromFile(conversionFactorsFilePath);
  } catch(e) {
    logger.error('Could not load conversion factors data from file', conversionFactorsFilePath);
    throw new Error(e);
  }
};

export const loadConversionFactorsFromLocalFile = async (): Promise<IConversionFactor[]> => {
  try {
    const factors: IConversionFactor[] = await getConversionFactors(`${__dirname}/../../data/conversionfactors.csv`) || [];

    logger.info(`[CONVERSION-FACTORS][LOAD-CONVERSION-FACTORS][${factors.length}]`);
    
    return factors;
  } catch (e) {
    logger.error(`[CONVERSION-FACTORS][LOAD-CONVERSION-FACTORS][ERROR][${e}]`);
  }
};

export const getSpeciesAliasesFromFile = (speciesmismatchPath: string): any[] => {
  try {
    return JSON.parse(fs.readFileSync(speciesmismatchPath, 'utf-8'));
  } catch (e) {
    logger.error('Could not load species aliases data from file', speciesmismatchPath);
    throw new Error(e);
  }
};

export const loadSpeciesAliasesFromLocalFile = (speciesmismatchFilePath?: string) => {
  const path = speciesmismatchFilePath || `${__dirname}/../../data/speciesmismatch.json`;
  try {
    return getSpeciesAliasesFromFile(path)
      .map((species: any) => ({ [species.speciesCode]: species.speciesAlias }))
      .reduce((result: any, current: any) => Object.assign(result, current), {});
  } catch (e) {
    logger.error(e);
    logger.error(`Cannot load speciesmismatch file from local file system, path: ${path}`);
    return {};
  }
};
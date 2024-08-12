import csv from 'csvtojson';
import { createBlobService, BlobService } from 'azure-storage';
import { IConversionFactor, IExporterBehaviour, IVessel } from 'mmo-shared-reference-data';
import logger from "../logger";

const CATCH_CERT_DATA_CONTAINER_NAME        = 'catchcertdata';
const NOTIFICATIONS_FILE_NAME               = 'Notification.json';
const VESSEL_DATA_FILE_NAME_KEY             = 'VesselAndLicenceData';
const EXPORTER_BEHAVIOUR_CONTAINER_NAME     = 'exporterbehaviour';
const EXPORTER_BEHAVIOUR_DATA_FILE_NAME     = 'exporter_behaviour.csv';
const SPECIES_MISMATCH_DATA_FILE_NAME       = 'speciesmismatch.json';
const SPECIES_MISMATCH_DATA_CONTAINER_NAME  = 'speciesmismatch';
const CONVERSION_FACTORS_CONTAINER_NAME     = 'conversionfactors';
const CONVERSION_FACTORS_DATA_FILE_NAME     = 'conversionfactors.csv';

export const readToText = (blobService: BlobService, containerName: string, blobName: string) => {
  return new Promise((res, rej) => {
    blobService.getBlobToText(containerName, blobName, (err, data) => {
      if (err) rej(err);
      res(data);
    });
  });
};

export const getVesselDateFromBlob = async (connectionString: string): Promise<IVessel[]> => {
  try {
    logger.info('connecting to blob storage');
    const service: BlobService = createBlobService(connectionString);
    logger.info('reading notification file');
    const notificationFileContent = await readToText(service, CATCH_CERT_DATA_CONTAINER_NAME, NOTIFICATIONS_FILE_NAME) as string;
    logger.info('parsing notification file to json');
    const notificationInJson = JSON.parse(notificationFileContent);
    logger.info('searching notification json');

    for (const n of notificationInJson) {
      if (n.viewName === VESSEL_DATA_FILE_NAME_KEY) {
        const blob = n.blobName;
        logger.info('Reading vessel data from', blob);
        const vesselsData = await readToText(service, CATCH_CERT_DATA_CONTAINER_NAME, blob) as string;
        return JSON.parse(vesselsData);
      }
    }

    throw new Error(`Cannot find vessel data in notification json, looking for key ${VESSEL_DATA_FILE_NAME_KEY}`);
  } catch(e) {
      logger.error(e);
      logger.error(`Cannot read remote file ${NOTIFICATIONS_FILE_NAME} from container ${CATCH_CERT_DATA_CONTAINER_NAME}`);
      throw new Error(e);
  }
}

export const getExporterBehaviourData = async (connectionString: string): Promise<IExporterBehaviour[]> => {
  try {
    const service = createBlobService(connectionString);
    const exporterBehaviourData = await readToText(service, EXPORTER_BEHAVIOUR_CONTAINER_NAME, EXPORTER_BEHAVIOUR_DATA_FILE_NAME) as string;

    const exporterBehaviourInJson = await csv({
      colParser:{
        "accountId": "string",
        "contactId": "string",
        "name": "string",
        "score": "number",
      },
      delimiter: ',',
      ignoreEmpty: true
    }).fromString(exporterBehaviourData);

    return exporterBehaviourInJson;
  }
  catch(e) {
    logger.error(e);
    logger.error(`Cannot read remote file ${EXPORTER_BEHAVIOUR_DATA_FILE_NAME} from container ${EXPORTER_BEHAVIOUR_CONTAINER_NAME}`);
    throw e;
  }
};

export const getSpeciesAliasesFromBlob = async (connectionString: string): Promise<any> => {
  try {
    logger.info('connecting to blob storage');
    const service = createBlobService(connectionString);
    logger.info('reading species aliases file');
    const speciesMismatchFileContent = await readToText(service, SPECIES_MISMATCH_DATA_CONTAINER_NAME, SPECIES_MISMATCH_DATA_FILE_NAME) as string;
    logger.info('parsing species aliases file to json');
    const speciesmismatchInJson = JSON.parse(speciesMismatchFileContent);
    logger.info('searching speciesmismatch json');

    return speciesmismatchInJson.map((species: any) => ({ [species.speciesCode]: species.speciesAlias }))
      .reduce((result: any, current: any) => Object.assign(result, current), {});
  } catch(e) {
      logger.error(e);
      logger.error(`Cannot read remote file ${SPECIES_MISMATCH_DATA_FILE_NAME} from container ${SPECIES_MISMATCH_DATA_CONTAINER_NAME}`);
      throw new Error(e);
  }
};

export const getConversionFactorsData = async (connectionString: string): Promise<IConversionFactor[]> => {
  try {
    const service = createBlobService(connectionString);
    const conversionFactorsData = await readToText(service, CONVERSION_FACTORS_CONTAINER_NAME, CONVERSION_FACTORS_DATA_FILE_NAME) as string;
    const conversionFactorsDataInJson = await csv({ delimiter: ',' }).fromString(conversionFactorsData);
    return conversionFactorsDataInJson;

  } catch (e) {
      logger.error(e);
      logger.error(`Cannot read remote file ${CONVERSION_FACTORS_DATA_FILE_NAME} from container ${CONVERSION_FACTORS_CONTAINER_NAME}`);
      throw new Error(e);
  }
};
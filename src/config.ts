import dotenv from 'dotenv';
dotenv.config();

export class ApplicationConfig {
  public port: string;
  public inDev: boolean;
  public instrumentationKey: string;
  public cloudRoleName: string;
  public basicAuthUser: string | any;
  public basicAuthPassword: string | any;
  public dbConnectionUri: string | any;
  public dbName: string | any;
  public blobStorageConnection: string;
  public scheduleFishCountriesAndSpeciesJob: string;
  public scheduleVesselsDataJob: string;

  public constructor() { }

  public static loadEnv(env: any): void {
    ApplicationConfig.prototype.basicAuthUser = env.REF_SERVICE_BASIC_AUTH_USER;
    ApplicationConfig.prototype.basicAuthPassword = env.REF_SERVICE_BASIC_AUTH_PASSWORD;
    ApplicationConfig.prototype.dbConnectionUri = env.DB_CONNECTION_URI || env.COSMOS_DB_RW_CONNECTION_URI;

    ApplicationConfig.prototype.port = env.PORT || '9001';
    ApplicationConfig.prototype.inDev = env.NODE_ENV === 'development';
    ApplicationConfig.prototype.instrumentationKey = env.INSTRUMENTATION_KEY;
    ApplicationConfig.prototype.cloudRoleName = env.INSTRUMENTATION_CLOUD_ROLE;
    ApplicationConfig.prototype.dbName = env.DB_NAME;
    ApplicationConfig.prototype.blobStorageConnection = env.REFERENCE_DATA_AZURE_STORAGE;
    ApplicationConfig.prototype.scheduleVesselsDataJob = env.REFRESH_VESSEL_JOB;
    ApplicationConfig.prototype.scheduleFishCountriesAndSpeciesJob = env.REFRESH_SPECIES_JOB;
  }

}

export default new ApplicationConfig();
import dotenv from 'dotenv';
dotenv.config();

export class ApplicationConfig {
  public port: string;
  public inDev: boolean;
  public instrumentationKey: string;
  public cloudRoleName: string;
  public memoryMonitoringEnabled: boolean;
  public memoryMonitoringIntervalMs: number;
  public basicAuthUser: string;
  public basicAuthPassword: string;
  public dbConnectionUri: string;
  public dbName: string;
  public blobStorageConnection: string;
  public scheduleFishCountriesAndSpeciesJob: string;
  public scheduleVesselsDataJob: string;

  private static parseBoolean(input: string | undefined, fallback: boolean): boolean {
    if (input === undefined) {
      return fallback;
    }

    const normalized = input.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }

  private static parsePositiveInteger(input: string | undefined, fallback: number): number {
    if (!input) {
      return fallback;
    }

    const parsed = Number.parseInt(input, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }

  public static loadEnv(env: any): void {
    ApplicationConfig.prototype.basicAuthUser = env.REF_SERVICE_BASIC_AUTH_USER;
    ApplicationConfig.prototype.basicAuthPassword = env.REF_SERVICE_BASIC_AUTH_PASSWORD;
    ApplicationConfig.prototype.dbConnectionUri = env.DB_CONNECTION_URI || env.COSMOS_DB_RW_CONNECTION_URI;

    ApplicationConfig.prototype.port = env.PORT || '9001';
    ApplicationConfig.prototype.inDev = env.NODE_ENV === 'development';
    ApplicationConfig.prototype.instrumentationKey = env.INSTRUMENTATION_KEY;
    ApplicationConfig.prototype.cloudRoleName = env.INSTRUMENTATION_CLOUD_ROLE;
    ApplicationConfig.prototype.memoryMonitoringEnabled = ApplicationConfig.parseBoolean(env.MEMORY_MONITORING_ENABLED, true);
    ApplicationConfig.prototype.memoryMonitoringIntervalMs = ApplicationConfig.parsePositiveInteger(env.MEMORY_MONITORING_INTERVAL_MS, 60000);
    ApplicationConfig.prototype.dbName = env.DB_NAME;
    ApplicationConfig.prototype.blobStorageConnection = env.REFERENCE_DATA_AZURE_STORAGE;
    ApplicationConfig.prototype.scheduleVesselsDataJob = env.REFRESH_VESSEL_JOB;
    ApplicationConfig.prototype.scheduleFishCountriesAndSpeciesJob = env.REFRESH_SPECIES_JOB;
  }

}

export default new ApplicationConfig();
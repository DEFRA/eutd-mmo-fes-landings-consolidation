import appConfig, { ApplicationConfig } from '../src/config';

describe('config', () => {
  it('loads defaults for memory monitoring when env vars are missing', () => {
    ApplicationConfig.loadEnv({});

    expect(appConfig.memoryMonitoringEnabled).toBe(true);
    expect(appConfig.memoryMonitoringIntervalMs).toBe(60000);
    expect(appConfig.catchCertificateFetchBatchSize).toBe(5);
  });

  it('loads configured memory monitoring values from env vars', () => {
    ApplicationConfig.loadEnv({
      MEMORY_MONITORING_ENABLED: 'false',
      MEMORY_MONITORING_INTERVAL_MS: '15000',
      CATCH_CERTIFICATE_FETCH_BATCH_SIZE: '7',
    });

    expect(appConfig.memoryMonitoringEnabled).toBe(false);
    expect(appConfig.memoryMonitoringIntervalMs).toBe(15000);
    expect(appConfig.catchCertificateFetchBatchSize).toBe(7);
  });

  it('falls back to default interval when interval is invalid', () => {
    ApplicationConfig.loadEnv({
      MEMORY_MONITORING_ENABLED: 'yes',
      MEMORY_MONITORING_INTERVAL_MS: 'abc',
    });

    expect(appConfig.memoryMonitoringEnabled).toBe(true);
    expect(appConfig.memoryMonitoringIntervalMs).toBe(60000);
    expect(appConfig.catchCertificateFetchBatchSize).toBe(5);
  });
});

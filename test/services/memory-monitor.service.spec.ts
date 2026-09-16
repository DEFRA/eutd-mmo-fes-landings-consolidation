import logger from '../../src/logger';
import config from '../../src/config';
import { startMemoryMonitor, stopMemoryMonitor } from '../../src/services/memory-monitor.service';
import * as appInsights from 'applicationinsights';

jest.mock('applicationinsights', () => ({
  defaultClient: {
    trackMetric: jest.fn(),
  },
}));

describe('memory-monitor.service', () => {
  const originalEnv = process.env;
  const originalMemoryUsage = process.memoryUsage;
  const originalConstrainedMemory = (process as { constrainedMemory?: () => number }).constrainedMemory;
  const originalAvailableMemory = (process as { availableMemory?: () => number }).availableMemory;

  let loggerInfoSpy: jest.SpyInstance;
  let setIntervalSpy: jest.SpyInstance;
  let clearIntervalSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'development' };

    config.instrumentationKey = 'instrumentation-key';
    config.memoryMonitoringEnabled = true;
    config.memoryMonitoringIntervalMs = 1000;

    process.memoryUsage = jest.fn(() => ({
      rss: 200 * 1024 * 1024,
      heapTotal: 100 * 1024 * 1024,
      heapUsed: 50 * 1024 * 1024,
      external: 10 * 1024 * 1024,
      arrayBuffers: 5 * 1024 * 1024,
    })) as unknown as typeof process.memoryUsage;

    (process as { constrainedMemory?: () => number }).constrainedMemory = jest.fn(() => 400 * 1024 * 1024);
    (process as { availableMemory?: () => number }).availableMemory = jest.fn(() => 300 * 1024 * 1024);

    loggerInfoSpy = jest.spyOn(logger, 'info').mockImplementation();
    clearIntervalSpy = jest.spyOn(global, 'clearInterval');
  });

  afterEach(() => {
    stopMemoryMonitor();

    process.env = originalEnv;
    process.memoryUsage = originalMemoryUsage;
    (process as { constrainedMemory?: () => number }).constrainedMemory = originalConstrainedMemory;
    (process as { availableMemory?: () => number }).availableMemory = originalAvailableMemory;

    loggerInfoSpy.mockRestore();
    clearIntervalSpy.mockRestore();
    if (setIntervalSpy) {
      setIntervalSpy.mockRestore();
    }
  });

  it('starts monitor, logs memory sample and unreferences timer', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => fakeTimer);

    startMemoryMonitor();

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    expect(fakeTimer.unref).toHaveBeenCalledTimes(1);
    expect(loggerInfoSpy).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STARTED][INTERVAL-MS][1000]');
    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[LANDINGS-CONSOLIDATION][MEMORY][RSS-MIB][200]'));
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledTimes(7);
  });

  it('does not start when disabled', () => {
    config.memoryMonitoringEnabled = false;
    setIntervalSpy = jest.spyOn(global, 'setInterval');

    startMemoryMonitor();

    expect(setIntervalSpy).not.toHaveBeenCalled();
  });

  it('stops monitor and clears timer', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => fakeTimer);

    startMemoryMonitor();
    stopMemoryMonitor();

    expect(clearIntervalSpy).toHaveBeenCalledWith(fakeTimer);
    expect(loggerInfoSpy).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STOPPED]');
  });

  it('does not emit app insights metrics when no instrumentation key is configured', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => fakeTimer);
    config.instrumentationKey = '';

    startMemoryMonitor();

    expect(appInsights.defaultClient.trackMetric).not.toHaveBeenCalled();
  });

  it('does not start a second interval when monitor is already running', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => fakeTimer);

    startMemoryMonitor();
    startMemoryMonitor();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
  });

  it('uses zero fallback when constrained and available memory APIs are not present', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => fakeTimer);
    (process as { constrainedMemory?: () => number }).constrainedMemory = undefined;
    (process as { availableMemory?: () => number }).availableMemory = undefined;

    startMemoryMonitor();

    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[CONSTRAINED-MIB][0][AVAILABLE-MIB][0]'));
  });
});

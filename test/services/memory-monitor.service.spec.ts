import logger from '../../src/logger';
import config from '../../src/config';
import { startMemoryMonitor, stopMemoryMonitor } from '../../src/services/memory-monitor.service';
import * as appInsights from 'applicationinsights';
import { constants } from 'node:perf_hooks';

type AppInsightsMock = {
  __setDefaultClient: (client: { trackMetric: jest.Mock } | undefined) => void;
};

const appInsightsMock = appInsights as unknown as AppInsightsMock;

const histogramMock = {
  enable: jest.fn(),
  disable: jest.fn(),
  reset: jest.fn(),
  mean: 2_500_000,
  max: 9_000_000,
  percentile: jest.fn(() => 13_000_000),
};

const observeMock = jest.fn();
const disconnectMock = jest.fn();
const getEntriesMock = jest.fn(() => []);
let observerCallback: ((list: { getEntries: () => Array<{ duration: number; detail?: { kind?: number }; kind?: number }> }) => void) | undefined;

jest.mock('node:perf_hooks', () => {
  const actual = jest.requireActual('node:perf_hooks');

  return {
    ...actual,
    monitorEventLoopDelay: jest.fn(() => histogramMock),
    PerformanceObserver: jest.fn().mockImplementation((callback) => {
      observerCallback = callback;
      return {
        observe: observeMock,
        disconnect: disconnectMock,
      };
    }),
  };
});

jest.mock('node:v8', () => ({
  getHeapStatistics: jest.fn(() => ({
    heap_size_limit: 1024 * 1024 * 1024,
  })),
}));

jest.mock('applicationinsights', () => ({
  __state: {
    defaultClient: {
      trackMetric: jest.fn(),
    },
  },
  get defaultClient() {
    return (this as { __state: { defaultClient?: { trackMetric: jest.Mock } } }).__state.defaultClient;
  },
  __setDefaultClient(client: { trackMetric: jest.Mock } | undefined) {
    (this as { __state: { defaultClient?: { trackMetric: jest.Mock } } }).__state.defaultClient = client;
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
    appInsightsMock.__setDefaultClient({
      trackMetric: jest.fn(),
    });

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

    histogramMock.enable.mockClear();
    histogramMock.disable.mockClear();
    histogramMock.reset.mockClear();
    histogramMock.percentile.mockClear();
    histogramMock.mean = 2_500_000;
    histogramMock.max = 9_000_000;
    observeMock.mockClear();
    disconnectMock.mockClear();
    getEntriesMock.mockClear();
    getEntriesMock.mockImplementation(() => []);
    observerCallback = undefined;
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
    expect(histogramMock.enable).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledWith({ entryTypes: ['gc'] });
    expect(loggerInfoSpy).toHaveBeenCalledWith('[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STARTED][INTERVAL-MS][1000]');
    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STARTUP][NODE-VERSION]'));
    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[ELD-MEAN-MS][2.5][ELD-MAX-MS][9][ELD-P99-MS][13]'));
    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[LANDINGS-CONSOLIDATION][MEMORY][RSS-MIB][200]'));
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledTimes(14);
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledWith({ name: 'landings.eventloop.delay.mean.ms', value: 2.5 });
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledWith({ name: 'landings.eventloop.delay.max.ms', value: 9 });
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledWith({ name: 'landings.eventloop.delay.p99.ms', value: 13 });
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledWith({ name: 'landings.gc.count', value: 0 });
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledWith({ name: 'landings.gc.pause.ms', value: 0 });
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledWith({ name: 'landings.gc.major.count', value: 0 });
    expect(appInsights.defaultClient.trackMetric).toHaveBeenCalledWith({ name: 'landings.gc.major.pause.ms', value: 0 });
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
    expect(histogramMock.disable).toHaveBeenCalledTimes(1);
    expect(disconnectMock).toHaveBeenCalledTimes(1);
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

  it('does not emit app insights metrics when no app insights default client is configured', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => fakeTimer);
    const originalClient = appInsights.defaultClient;
    appInsightsMock.__setDefaultClient(undefined);

    startMemoryMonitor();

    expect(originalClient.trackMetric).not.toHaveBeenCalled();
    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[LANDINGS-CONSOLIDATION][MEMORY][RSS-MIB][200]'));
  });

  it('does not start a second interval when monitor is already running', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation(() => fakeTimer);

    startMemoryMonitor();
    startMemoryMonitor();

    expect(setIntervalSpy).toHaveBeenCalledTimes(1);
    expect(histogramMock.enable).toHaveBeenCalledTimes(1);
    expect(observeMock).toHaveBeenCalledTimes(1);
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

  it('aggregates and resets GC counters per sample interval', () => {
    const fakeTimer = {
      unref: jest.fn(),
    } as unknown as NodeJS.Timeout;

    let sampleCallback: (() => void) | undefined;
    setIntervalSpy = jest.spyOn(global, 'setInterval').mockImplementation((callback) => {
      sampleCallback = callback as () => void;
      return fakeTimer;
    });

    startMemoryMonitor();

    expect(observerCallback).toBeDefined();
    if (observerCallback) {
      getEntriesMock.mockImplementation(() => [
        { duration: 35.18, detail: { kind: constants.NODE_PERFORMANCE_GC_MAJOR } },
        { duration: 4.11, detail: { kind: constants.NODE_PERFORMANCE_GC_MINOR } },
        { duration: 3.33, kind: constants.NODE_PERFORMANCE_GC_MAJOR },
        { duration: 1.01 },
      ]);
      observerCallback({ getEntries: getEntriesMock });
    }

    histogramMock.mean = 12_000_000;
    histogramMock.max = 25_000_000;
    histogramMock.percentile.mockReturnValueOnce(30_000_000);

    if (sampleCallback) {
      sampleCallback();
    }

    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[GC-COUNT][4][GC-PAUSE-MS][43.63][GC-MAJOR-COUNT][2][GC-MAJOR-PAUSE-MS][38.51]'));
    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[ELD-MEAN-MS][12][ELD-MAX-MS][25][ELD-P99-MS][30]'));

    if (sampleCallback) {
      sampleCallback();
    }

    expect(loggerInfoSpy).toHaveBeenCalledWith(expect.stringContaining('[GC-COUNT][0][GC-PAUSE-MS][0][GC-MAJOR-COUNT][0][GC-MAJOR-PAUSE-MS][0]'));
    expect(histogramMock.reset).toHaveBeenCalled();
  });
});

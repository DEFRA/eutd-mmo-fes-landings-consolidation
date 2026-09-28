import * as appInsights from 'applicationinsights';
import { constants, monitorEventLoopDelay, PerformanceObserver } from 'node:perf_hooks';
import * as v8 from 'node:v8';
import config from '../config';
import logger from '../logger';

let monitorHandle: NodeJS.Timeout | undefined;
let eventLoopDelayHistogram: ReturnType<typeof monitorEventLoopDelay> | undefined;
let gcObserver: PerformanceObserver | undefined;
let startupDiagnosticsLogged = false;

type GcCounters = {
  totalCount: number;
  totalPauseMs: number;
  majorCount: number;
  majorPauseMs: number;
};

type GcEntry = {
  duration: number;
  detail?: {
    kind?: number;
  };
  kind?: number;
};

type MemoryMetricsPayload = {
  rssMiB: number;
  heapUsedMiB: number;
  heapTotalMiB: number;
  externalMiB: number;
  arrayBuffersMiB: number;
  constrainedMemoryMiB: number;
  availableMemoryMiB: number;
  eventLoopDelayMeanMs: number;
  eventLoopDelayMaxMs: number;
  eventLoopDelayP99Ms: number;
  gcCount: number;
  gcPauseMs: number;
  gcMajorCount: number;
  gcMajorPauseMs: number;
};

let gcCounters: GcCounters = {
  totalCount: 0,
  totalPauseMs: 0,
  majorCount: 0,
  majorPauseMs: 0,
};

const bytesToMiB = (value: number): number => Number((value / (1024 * 1024)).toFixed(2));
const nsToMs = (value: number): number => Number((value / 1_000_000).toFixed(2));

const resetGcCounters = (): void => {
  gcCounters = {
    totalCount: 0,
    totalPauseMs: 0,
    majorCount: 0,
    majorPauseMs: 0,
  };
};

const getGcKind = (entry: GcEntry): number | undefined => {
  const perfNodeEntry = entry;

  if (typeof perfNodeEntry.detail?.kind === 'number') {
    return perfNodeEntry.detail.kind;
  }

  if (typeof perfNodeEntry.kind === 'number') {
    return perfNodeEntry.kind;
  }

  return undefined;
};

const getConstrainedMemoryInBytes = (): number => {
  const constrainedMemoryFn = (process as { constrainedMemory?: () => number }).constrainedMemory;
  return typeof constrainedMemoryFn === 'function' ? constrainedMemoryFn() : 0;
};

const getAvailableMemoryInBytes = (): number => {
  const availableMemoryFn = (process as { availableMemory?: () => number }).availableMemory;
  return typeof availableMemoryFn === 'function' ? availableMemoryFn() : 0;
};

const logStartupDiagnostics = (): void => {
  if (startupDiagnosticsLogged) {
    return;
  }

  const heapLimitMiB = bytesToMiB(v8.getHeapStatistics().heap_size_limit);
  logger.info(`[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STARTUP][NODE-VERSION][${process.version}][EXEC-ARGV][${JSON.stringify(process.execArgv)}][HEAP-LIMIT-MIB][${heapLimitMiB}]`);
  startupDiagnosticsLogged = true;
};

const startGcObserver = (): void => {
  gcObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries() as GcEntry[];
    for (const entry of entries) {
      gcCounters.totalCount += 1;
      gcCounters.totalPauseMs += entry.duration;

      if (getGcKind(entry) === constants.NODE_PERFORMANCE_GC_MAJOR) {
        gcCounters.majorCount += 1;
        gcCounters.majorPauseMs += entry.duration;
      }
    }
  });

  gcObserver.observe({ entryTypes: ['gc'] });
};

const startEventLoopDelayHistogram = (): void => {
  eventLoopDelayHistogram = monitorEventLoopDelay({ resolution: 20 });
  eventLoopDelayHistogram.enable();
};

const trackMemoryMetrics = (metrics: MemoryMetricsPayload): void => {
  if (!config.instrumentationKey || !appInsights.defaultClient) {
    return;
  }

  appInsights.defaultClient.trackMetric({ name: 'landings.memory.rss.mib', value: metrics.rssMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.heap.used.mib', value: metrics.heapUsedMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.heap.total.mib', value: metrics.heapTotalMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.external.mib', value: metrics.externalMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.arraybuffers.mib', value: metrics.arrayBuffersMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.constrained.mib', value: metrics.constrainedMemoryMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.available.mib', value: metrics.availableMemoryMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.eventloop.delay.mean.ms', value: metrics.eventLoopDelayMeanMs });
  appInsights.defaultClient.trackMetric({ name: 'landings.eventloop.delay.max.ms', value: metrics.eventLoopDelayMaxMs });
  appInsights.defaultClient.trackMetric({ name: 'landings.eventloop.delay.p99.ms', value: metrics.eventLoopDelayP99Ms });
  appInsights.defaultClient.trackMetric({ name: 'landings.gc.count', value: metrics.gcCount });
  appInsights.defaultClient.trackMetric({ name: 'landings.gc.pause.ms', value: metrics.gcPauseMs });
  appInsights.defaultClient.trackMetric({ name: 'landings.gc.major.count', value: metrics.gcMajorCount });
  appInsights.defaultClient.trackMetric({ name: 'landings.gc.major.pause.ms', value: metrics.gcMajorPauseMs });
};

const sampleMemory = (): void => {
  const histogram = eventLoopDelayHistogram as NonNullable<typeof eventLoopDelayHistogram>;
  const memory = process.memoryUsage();
  const metricsPayload: MemoryMetricsPayload = {
    rssMiB: bytesToMiB(memory.rss),
    heapUsedMiB: bytesToMiB(memory.heapUsed),
    heapTotalMiB: bytesToMiB(memory.heapTotal),
    externalMiB: bytesToMiB(memory.external),
    arrayBuffersMiB: bytesToMiB(memory.arrayBuffers),
    constrainedMemoryMiB: bytesToMiB(getConstrainedMemoryInBytes()),
    availableMemoryMiB: bytesToMiB(getAvailableMemoryInBytes()),
    eventLoopDelayMeanMs: nsToMs(histogram.mean),
    eventLoopDelayMaxMs: nsToMs(histogram.max),
    eventLoopDelayP99Ms: nsToMs(histogram.percentile(99)),
    gcCount: gcCounters.totalCount,
    gcPauseMs: Number(gcCounters.totalPauseMs.toFixed(2)),
    gcMajorCount: gcCounters.majorCount,
    gcMajorPauseMs: Number(gcCounters.majorPauseMs.toFixed(2)),
  };

  histogram.reset();

  resetGcCounters();

  logger.info(`[LANDINGS-CONSOLIDATION][MEMORY][RSS-MIB][${metricsPayload.rssMiB}][HEAP-USED-MIB][${metricsPayload.heapUsedMiB}][HEAP-TOTAL-MIB][${metricsPayload.heapTotalMiB}][EXTERNAL-MIB][${metricsPayload.externalMiB}][ARRAY-BUFFERS-MIB][${metricsPayload.arrayBuffersMiB}][CONSTRAINED-MIB][${metricsPayload.constrainedMemoryMiB}][AVAILABLE-MIB][${metricsPayload.availableMemoryMiB}][ELD-MEAN-MS][${metricsPayload.eventLoopDelayMeanMs}][ELD-MAX-MS][${metricsPayload.eventLoopDelayMaxMs}][ELD-P99-MS][${metricsPayload.eventLoopDelayP99Ms}][GC-COUNT][${metricsPayload.gcCount}][GC-PAUSE-MS][${metricsPayload.gcPauseMs}][GC-MAJOR-COUNT][${metricsPayload.gcMajorCount}][GC-MAJOR-PAUSE-MS][${metricsPayload.gcMajorPauseMs}]`);

  trackMemoryMetrics(metricsPayload);
};

export const startMemoryMonitor = (): void => {
  if (!config.memoryMonitoringEnabled || monitorHandle) {
    return;
  }

  logStartupDiagnostics();
  startEventLoopDelayHistogram();
  startGcObserver();

  logger.info(`[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STARTED][INTERVAL-MS][${config.memoryMonitoringIntervalMs}]`);
  sampleMemory();

  monitorHandle = setInterval(sampleMemory, config.memoryMonitoringIntervalMs);
  monitorHandle.unref();
};

export const stopMemoryMonitor = (): void => {
  if (!monitorHandle) {
    return;
  }

  clearInterval(monitorHandle);
  monitorHandle = undefined;

  if (eventLoopDelayHistogram) {
    eventLoopDelayHistogram.disable();
    eventLoopDelayHistogram = undefined;
  }

  if (gcObserver) {
    gcObserver.disconnect();
    gcObserver = undefined;
  }

  resetGcCounters();
  logger.info('[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STOPPED]');
};

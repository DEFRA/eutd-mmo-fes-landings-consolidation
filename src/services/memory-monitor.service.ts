import * as appInsights from 'applicationinsights';
import config from '../config';
import logger from '../logger';

let monitorHandle: NodeJS.Timeout | undefined;

const bytesToMiB = (value: number): number => Number((value / (1024 * 1024)).toFixed(2));

const getConstrainedMemoryInBytes = (): number => {
  const constrainedMemoryFn = (process as { constrainedMemory?: () => number }).constrainedMemory;
  return typeof constrainedMemoryFn === 'function' ? constrainedMemoryFn() : 0;
};

const getAvailableMemoryInBytes = (): number => {
  const availableMemoryFn = (process as { availableMemory?: () => number }).availableMemory;
  return typeof availableMemoryFn === 'function' ? availableMemoryFn() : 0;
};

const trackMemoryMetrics = (rssMiB: number, heapUsedMiB: number, heapTotalMiB: number, externalMiB: number, arrayBuffersMiB: number, constrainedMemoryMiB: number, availableMemoryMiB: number): void => {
  if (!config.instrumentationKey || !appInsights.defaultClient) {
    return;
  }

  appInsights.defaultClient.trackMetric({ name: 'landings.memory.rss.mib', value: rssMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.heap.used.mib', value: heapUsedMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.heap.total.mib', value: heapTotalMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.external.mib', value: externalMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.arraybuffers.mib', value: arrayBuffersMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.constrained.mib', value: constrainedMemoryMiB });
  appInsights.defaultClient.trackMetric({ name: 'landings.memory.available.mib', value: availableMemoryMiB });
};

const sampleMemory = (): void => {
  const memory = process.memoryUsage();
  const rssMiB = bytesToMiB(memory.rss);
  const heapUsedMiB = bytesToMiB(memory.heapUsed);
  const heapTotalMiB = bytesToMiB(memory.heapTotal);
  const externalMiB = bytesToMiB(memory.external);
  const arrayBuffersMiB = bytesToMiB(memory.arrayBuffers);
  const constrainedMemoryMiB = bytesToMiB(getConstrainedMemoryInBytes());
  const availableMemoryMiB = bytesToMiB(getAvailableMemoryInBytes());

  logger.info(`[LANDINGS-CONSOLIDATION][MEMORY][RSS-MIB][${rssMiB}][HEAP-USED-MIB][${heapUsedMiB}][HEAP-TOTAL-MIB][${heapTotalMiB}][EXTERNAL-MIB][${externalMiB}][ARRAY-BUFFERS-MIB][${arrayBuffersMiB}][CONSTRAINED-MIB][${constrainedMemoryMiB}][AVAILABLE-MIB][${availableMemoryMiB}]`);

  trackMemoryMetrics(
    rssMiB,
    heapUsedMiB,
    heapTotalMiB,
    externalMiB,
    arrayBuffersMiB,
    constrainedMemoryMiB,
    availableMemoryMiB
  );
};

export const startMemoryMonitor = (): void => {
  if (!config.memoryMonitoringEnabled || monitorHandle) {
    return;
  }

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
  logger.info('[LANDINGS-CONSOLIDATION][MEMORY][MONITOR][STOPPED]');
};

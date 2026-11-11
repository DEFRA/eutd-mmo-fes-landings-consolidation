export type ConcurrencyLimiter = <T>(task: () => Promise<T>) => Promise<T>;

// Runs at most `maxConcurrent` tasks at once; further tasks wait in FIFO order.
// Bounds the number of consolidation runs holding certificate data in memory at the same time.
export const createConcurrencyLimiter = (maxConcurrent: number): ConcurrencyLimiter => {
  const limit = Number.isFinite(maxConcurrent) && maxConcurrent >= 1 ? Math.floor(maxConcurrent) : 1;
  const waiting: Array<() => void> = [];
  let active = 0;

  const release = (): void => {
    const next = waiting.shift();
    if (next) {
      next();
    } else {
      active -= 1;
    }
  };

  return async <T>(task: () => Promise<T>): Promise<T> => {
    if (active < limit) {
      active += 1;
    } else {
      // the slot is handed over directly by release(), so `active` stays unchanged
      await new Promise<void>((resolve) => waiting.push(resolve));
    }

    try {
      return await task();
    } finally {
      release();
    }
  };
};

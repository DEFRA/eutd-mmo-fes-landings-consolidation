import { createConcurrencyLimiter } from '../../src/services/concurrency-limiter';

const deferred = () => {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => { resolve = res; });
  return { promise, resolve };
};

describe('concurrency limiter', () => {
  it('never runs more tasks than the limit and preserves FIFO order', async () => {
    const limit = createConcurrencyLimiter(2);
    const gates = [deferred(), deferred(), deferred(), deferred()];
    const started: number[] = [];
    let active = 0;
    let maxActive = 0;

    const results = gates.map((gate, i) => limit(async () => {
      started.push(i);
      active += 1;
      maxActive = Math.max(maxActive, active);
      await gate.promise;
      active -= 1;
      return i;
    }));

    await Promise.resolve();
    expect(started).toEqual([0, 1]);

    gates[0].resolve();
    await results[0];
    await Promise.resolve();
    expect(started).toEqual([0, 1, 2]);

    gates.forEach((gate) => gate.resolve());
    await expect(Promise.all(results)).resolves.toEqual([0, 1, 2, 3]);
    expect(started).toEqual([0, 1, 2, 3]);
    expect(maxActive).toBe(2);
  });

  it('releases the slot when a task fails', async () => {
    const limit = createConcurrencyLimiter(1);

    await expect(limit(async () => { throw new Error('boom'); })).rejects.toThrow('boom');
    await expect(limit(async () => 'ok')).resolves.toBe('ok');
  });

  it('falls back to a limit of 1 for invalid values', async () => {
    const limit = createConcurrencyLimiter(Number.NaN);
    const gate = deferred();
    const started: number[] = [];

    const first = limit(async () => { started.push(1); await gate.promise; });
    const second = limit(async () => { started.push(2); });

    await Promise.resolve();
    expect(started).toEqual([1]);

    gate.resolve();
    await Promise.all([first, second]);
    expect(started).toEqual([1, 2]);
  });
});

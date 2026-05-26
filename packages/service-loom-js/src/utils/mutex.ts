import { createControlledPromise } from './utils.js';

/**
 * Async mutual exclusion lock. Queues tasks so only one runs at a time.
 * Each call to `doLocked` waits for the previous task to finish before starting.
 */
export class AsyncMutex {
  private _lock = Promise.resolve();

  /**
   * Runs `task` exclusively — waits for any in-progress task to finish first.
   *
   * The `signal` is forwarded to `task` and also races against it: if the signal
   * aborts while the task is running, the returned promise rejects immediately
   * (the task itself continues until it respects the signal or completes).
   * If the signal is already aborted when the lock is acquired, rejects without
   * calling `task`.
   *
   * @param task - Async work to run exclusively. Receives the `AbortSignal` so it
   *   can forward it to fetch, timers, or nested locks for true cancellation.
   * @param options.signal - Optional `AbortSignal` to cancel the wait or the task.
   *
   * @example
   * ```ts
   * const mutex = new AsyncMutex();
   *
   * // basic serialization
   * await mutex.doLocked(async () => { ... });
   *
   * // with cancellation
   * const ac = new AbortController();
   * mutex.doLocked(async (signal) => fetch(url, { signal }), { signal: ac.signal });
   * ac.abort(); // cancels immediately
   * ```
   */
  doLocked<T>(
    task: (signal?: AbortSignal) => Promise<T>,
    options?: { signal?: AbortSignal | undefined },
  ): Promise<T> {
    options = { ...{}, ...options };
    const { signal } = options;

    // task will run after lock promise is resolved.
    // lock --> task
    const next = this._lock.then(async () => {
      if (signal) {
        // early abort:
        signal.throwIfAborted();

        // signal abort will trigger abortPromise to reject
        const abortHandler = createControlledPromise<T>();
        const callback = () => abortHandler.reject('aborted');
        signal.addEventListener('abort', callback);

        // -- race the task and abortPromise - first to settle wins:
        const abortPromise = abortHandler.promise;
        const taskPromise = task(signal);
        try {
          return await Promise.race([taskPromise, abortPromise]);
        } finally {
          // cleanup

          // who ever won the race - the other might still reject.
          // suppress too-late-rejections
          taskPromise.catch(() => {});
          abortPromise.catch(() => {});

          // dont leave dangling promises and listeners
          signal.removeEventListener('abort', callback);
          abortHandler.reject();
        }
      }

      // not using signal - just run task normally
      return task(signal);
    });

    // trigger next action (errors are only eaten internally, client will also get them)
    this._lock = next.catch(() => {}).then(() => {});

    // return the execution promise chain:
    return next;
  }
}

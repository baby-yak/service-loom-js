import { describe, expect, it, vi } from 'vitest';
import { createModule } from '../modules/moduleFactory.js';
import { Service } from '../services/service.js';
import type { ServiceDescriptor } from '../services/types.js';

// ---------------------------------------------------------------------------
// Shared descriptors
// ---------------------------------------------------------------------------

type ICounter = ServiceDescriptor<{
  state: { count: number };
  events: { changed: () => void };
  actions: { increment(): void };
}>;

type ILogger = ServiceDescriptor<{
  actions: { log(msg: string): void };
}>;

// ---------------------------------------------------------------------------
// Shared service implementations
// ---------------------------------------------------------------------------

class CounterService extends Service<ICounter> implements ICounter {
  constructor() {
    super('counter', { count: 0 });
  }
  increment() {
    this.state.update((s) => {
      s.count += 1;
    });
    this.events.emit('changed');
  }
}

class LoggerService extends Service<ILogger> implements ILogger {
  readonly log = vi.fn();
  constructor() {
    super('logger');
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

type AppShape = { counter: Service<ICounter> };

describe('Module', () => {
  // -------------------------------------------------------------------------
  // construction
  // -------------------------------------------------------------------------
  describe('construction', () => {
    it('exposes typed clients — implicit descriptor', () => {
      const app = createModule({ counter: new CounterService() });
      expect(app.services.counter).toBeDefined();
      expect(app.services.counter.state).toBeDefined();
      expect(app.services.counter.events).toBeDefined();
      expect(app.services.counter.actions).toBeDefined();
    });

    it('exposes typed clients — explicit descriptor', () => {
      const app = createModule<AppShape>({ counter: new CounterService() });
      expect(app.services.counter).toBeDefined();
    });

    it('actions are functional through the client', () => {
      const app = createModule({ counter: new CounterService() });
      app.services.counter.actions.increment();
      expect(app.services.counter.state.get().count).toBe(1);
    });

    it('events received through the client', () => {
      const app = createModule<AppShape>({ counter: new CounterService() });
      const listener = vi.fn();
      app.services.counter.events.on('changed', listener);
      app.services.counter.actions.increment();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('accepts multiple services', () => {
      const app = createModule<{ counter: Service<ICounter>; logger: Service<ILogger> }>({
        counter: new CounterService(),
        logger: new LoggerService(),
      });
      expect(app.services.counter).toBeDefined();
      expect(app.services.logger).toBeDefined();
    });

    it('exposes the module name', () => {
      const app = createModule({ counter: new CounterService() }, { name: 'my-app' });
      expect(app.name).toBe('my-app');
    });
  });

  // -------------------------------------------------------------------------
  // lifecycle — start
  // -------------------------------------------------------------------------
  describe('start()', () => {
    it('calls onServiceInit → onServiceStart → onServiceAfterStart in order', async () => {
      const calls: string[] = [];

      class OrderedService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        onServiceInit() { calls.push('init'); }
        onServiceStart() { calls.push('start'); }
        onServiceAfterStart() { calls.push('afterStart'); }
      }

      await createModule<AppShape>({ counter: new OrderedService() }).start();
      expect(calls).toEqual(['init', 'start', 'afterStart']);
    });

    it('all services complete one phase before the next begins', async () => {
      const calls: string[] = [];

      class PhaseService extends Service<ICounter> implements ICounter {
        constructor(private id: string) {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        onServiceInit() { calls.push(`${this.id}:init`); }
        onServiceStart() { calls.push(`${this.id}:start`); }
      }

      await createModule<{ a: Service<ICounter>; b: Service<ICounter> }>({
        a: new PhaseService('a'),
        b: new PhaseService('b'),
      }).start();

      expect(calls).toEqual(['a:init', 'b:init', 'a:start', 'b:start']);
    });

    it('awaits async lifecycle methods before advancing', async () => {
      const calls: string[] = [];

      class AsyncService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        async onServiceInit() {
          await Promise.resolve();
          calls.push('init');
        }
        onServiceStart() { calls.push('start'); }
      }

      await createModule<AppShape>({ counter: new AsyncService() }).start();
      expect(calls).toEqual(['init', 'start']);
    });
  });

  // -------------------------------------------------------------------------
  // lifecycle — stop
  // -------------------------------------------------------------------------
  describe('stop()', () => {
    it('calls onServiceBeforeStop → onServiceStop in order', async () => {
      const calls: string[] = [];

      class StopService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        onServiceBeforeStop() { calls.push('beforeStop'); }
        onServiceStop() { calls.push('stop'); }
      }

      const app = createModule<AppShape>({ counter: new StopService() });
      await app.start();
      await app.stop();
      expect(calls).toEqual(['beforeStop', 'stop']);
    });

    it('all services complete beforeStop before any service runs stop', async () => {
      const calls: string[] = [];

      class StopPhaseService extends Service<ICounter> implements ICounter {
        constructor(private id: string) {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        onServiceBeforeStop() { calls.push(`${this.id}:beforeStop`); }
        onServiceStop() { calls.push(`${this.id}:stop`); }
      }

      const app = createModule<{ a: Service<ICounter>; b: Service<ICounter> }>({
        a: new StopPhaseService('a'),
        b: new StopPhaseService('b'),
      });
      await app.start();
      await app.stop();
      expect(calls).toEqual(['a:beforeStop', 'b:beforeStop', 'a:stop', 'b:stop']);
    });
  });

  // -------------------------------------------------------------------------
  // error handling
  // -------------------------------------------------------------------------
  describe('error handling', () => {
    it('start() rejects when a service throws during init', async () => {
      class BrokenService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        onServiceInit() {
          throw new Error('boom');
        }
      }

      const app = createModule({ counter: new BrokenService() });
      await expect(app.start()).rejects.toThrow('boom');
    });
  });

  // -------------------------------------------------------------------------
  // lifecycle guards & mutex
  // -------------------------------------------------------------------------
  describe('lifecycle guards', () => {
    it('double start() runs lifecycle only once', async () => {
      const calls: string[] = [];

      class TrackedService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        onServiceInit() { calls.push('init'); }
      }

      const app = createModule({ counter: new TrackedService() });
      await app.start();
      await app.start();
      expect(calls).toEqual(['init']);
    });

    it('double stop() runs lifecycle only once', async () => {
      const calls: string[] = [];

      class TrackedService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        onServiceStop() { calls.push('stop'); }
      }

      const app = createModule({ counter: new TrackedService() });
      await app.start();
      await app.stop();
      await app.stop();
      expect(calls).toEqual(['stop']);
    });

    it('concurrent stop() waits for start() to finish before running', async () => {
      const calls: string[] = [];

      class SlowService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
        async onServiceInit() {
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
          calls.push('init');
        }
        onServiceStop() { calls.push('stop'); }
      }

      const app = createModule({ counter: new SlowService() });
      await Promise.all([app.start(), app.stop()]);
      expect(calls).toEqual(['init', 'stop']);
    });
  });

  // -------------------------------------------------------------------------
  // verbose option
  // -------------------------------------------------------------------------
  describe('verbose option', () => {
    it('logs lifecycle phases when verbose is true', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      class SimpleService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
      }

      await createModule({ counter: new SimpleService() }, { verbose: true }).start();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does not log when verbose is false', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      class SimpleService extends Service<ICounter> implements ICounter {
        constructor() {
          super(undefined, { count: 0 });
        }
        increment(): void {}
      }

      await createModule({ counter: new SimpleService() }, { verbose: false }).start();
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

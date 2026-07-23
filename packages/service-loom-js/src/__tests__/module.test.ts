import { describe, expect, it, vi } from 'vitest';
import { createModule } from '../modules/moduleFactory.js';
import type { ServiceDescriptor } from '../services/types.js';
import { Service } from '../services/service.js';

// ---------------------------------------------------------------------------
// Shared test services
// ---------------------------------------------------------------------------

type ICounter = ServiceDescriptor<{
  state: { count: number };
  events: { changed: () => void };
  actions: { increment(): void };
}>;

type ILogger = ServiceDescriptor<{
  actions: { log(msg: string): void };
}>;

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

describe('Module', () => {
  //-------------------------------------------------------
  //-- construction
  //-------------------------------------------------------
  type ModuleDescriptor = {
    counter: Service<ICounter>;
  };

  describe('construction', () => {
    it('exposes typed clients for each service', () => {
      const app = createModule({ counter: new CounterService() });
      expect(app.services.counter).toBeDefined();
      expect(app.services.counter.state).toBeDefined();
      expect(app.services.counter.events).toBeDefined();
      expect(app.services.counter.actions).toBeDefined();
    });

    it('clients are functional — actions invoke the service', () => {
      const app = createModule({ counter: new CounterService() });
      app.services.counter.actions.invoke.increment();
      expect(app.services.counter.state.get().count).toBe(1);
    });

    it('clients receive events emitted by the service', () => {
      const app = createModule<{ counter: Service<ICounter> }>({ counter: new CounterService() });
      const listener = vi.fn();
      app.services.counter.events.on('changed', listener);
      app.services.counter.actions.invoke.increment();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('accepts multiple services', () => {
      const app = createModule<{
        counter: Service<ICounter>;
        logger: Service<ILogger>;
      }>({
        counter: new CounterService(),
        logger: new LoggerService(),
      });
      expect(app.services.counter).toBeDefined();
      expect(app.services.logger).toBeDefined();
    });
  });

  //-------------------------------------------------------
  //-- lifecycle — start
  //-------------------------------------------------------

  describe('start()', () => {
    it('calls onServiceInit → onServiceStart → onServiceAfterStart in order', async () => {
      const calls: string[] = [];

      class OrderedService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
        onServiceInit() {
          calls.push('init');
        }
        onServiceStart() {
          calls.push('start');
        }
        onServiceAfterStart() {
          calls.push('afterStart');
        }
      }

      const app = createModule<ModuleDescriptor>({ counter: new OrderedService() });
      await app.start();

      expect(calls).toEqual(['init', 'start', 'afterStart']);
    });

    it('completes all services in one phase before moving to the next', async () => {
      const calls: string[] = [];

      class PhaseService extends Service<ICounter> implements ICounter {
        constructor(private id: string) {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }

        onServiceInit() {
          calls.push(`${this.id}:init`);
        }
        onServiceStart() {
          calls.push(`${this.id}:start`);
        }
      }

      const app = createModule<{ a: Service<ICounter>; b: Service<ICounter> }>({
        a: new PhaseService('a'),
        b: new PhaseService('b'),
      });
      await app.start();

      expect(calls).toEqual(['a:init', 'b:init', 'a:start', 'b:start']);
    });

    it('awaits async lifecycle methods', async () => {
      const calls: string[] = [];

      class AsyncService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
        async onServiceInit() {
          await Promise.resolve();
          calls.push('init');
        }
        onServiceStart() {
          calls.push('start');
        }
      }

      const app = createModule<ModuleDescriptor>({ counter: new AsyncService() });
      await app.start();

      expect(calls).toEqual(['init', 'start']);
    });
  });

  //-------------------------------------------------------
  //-- lifecycle — stop
  //-------------------------------------------------------

  describe('stop()', () => {
    it('calls onServiceBeforeStop → onServiceStop in order', async () => {
      const calls: string[] = [];

      class StopService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }

        increment(): void {
          throw new Error('Method not implemented.');
        }
        onServiceBeforeStop() {
          calls.push('beforeStop');
        }
        onServiceStop() {
          calls.push('stop');
        }
      }

      const app = createModule<ModuleDescriptor>({ counter: new StopService() });
      await app.start();
      await app.stop();
      expect(calls).toEqual(['beforeStop', 'stop']);
    });

    it('completes all services in beforeStop before any service runs stop', async () => {
      const calls: string[] = [];

      class StopPhaseService extends Service<ICounter> implements ICounter {
        constructor(private id: string) {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
        onServiceBeforeStop() {
          calls.push(`${this.id}:beforeStop`);
        }
        onServiceStop() {
          calls.push(`${this.id}:stop`);
        }
      }

      const app = createModule<{
        a: Service<ICounter>;
        b: Service<ICounter>;
      }>({
        a: new StopPhaseService('a'),
        b: new StopPhaseService('b'),
      });
      await app.start();
      await app.stop();

      expect(calls).toEqual(['a:beforeStop', 'b:beforeStop', 'a:stop', 'b:stop']);
    });
  });

  //-------------------------------------------------------
  //-- waitForStart / waitForStop
  //-------------------------------------------------------

  describe('waitForStart() / waitForStop()', () => {
    it('waitForStart() rejects if a service throws during start', async () => {
      class BrokenService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
        onServiceInit() {
          throw new Error('boom');
        }
      }

      const app = createModule({ counter: new BrokenService() });
      await expect(app.start()).rejects.toThrow('boom');
    });
  });

  //-------------------------------------------------------
  //-- lifecycle guards & mutex
  //-------------------------------------------------------

  describe('lifecycle guards', () => {
    it('double start() is a no-op — lifecycle runs only once', async () => {
      const calls: string[] = [];

      class TrackedService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
        onServiceInit() {
          calls.push('init');
        }
      }

      const app = createModule({ counter: new TrackedService() });
      await app.start();
      await app.start();
      expect(calls).toEqual(['init']);
    });

    it('double stop() is a no-op', async () => {
      const calls: string[] = [];

      class TrackedService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
        onServiceStop() {
          calls.push('stop');
        }
      }

      const app = createModule({ counter: new TrackedService() });
      await app.start();
      await app.stop();
      await app.stop();
      expect(calls).toEqual(['stop']);
    });

    it('stop() called concurrently with start() waits for start to finish first', async () => {
      const calls: string[] = [];

      class SlowService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
        async onServiceInit() {
          await new Promise<void>((resolve) => setTimeout(resolve, 10));
          calls.push('init');
        }
        onServiceStop() {
          calls.push('stop');
        }
      }

      const app = createModule({ counter: new SlowService() });
      // subscribe before starting so we don't miss the event
      await Promise.all([app.start(), app.stop()]);
      expect(calls).toEqual(['init', 'stop']);
    });
  });

  //-------------------------------------------------------
  //-- verbose
  //-------------------------------------------------------

  describe('verbose option', () => {
    it('logs each lifecycle phase when verbose is true', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      class SimpleService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
      }

      const app = createModule({ counter: new SimpleService() }, { verbose: true });
      await app.start();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does not log when verbose is false', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      class SimpleService extends Service<ICounter> implements ICounter {
        constructor() {
          super('counter', { count: 0 });
        }
        increment(): void {
          throw new Error('Method not implemented.');
        }
      }

      const app = createModule({ counter: new SimpleService() }, { verbose: false });
      await app.start();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

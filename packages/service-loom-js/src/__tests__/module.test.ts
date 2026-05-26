import { describe, expect, it, vi } from 'vitest';
import { createModule } from '../modules/moduleFactory.js';
import { Service } from '../services/service.js';

// ---------------------------------------------------------------------------
// Shared test services
// ---------------------------------------------------------------------------

type ICounter = {
  state: { count: number };
  events: { changed: () => void };
  actions: { increment(): void };
};

type ILogger = {
  actions: { log(msg: string): void };
};

class CounterService extends Service<ICounter> {
  constructor() {
    super({ count: 0 }, { name: 'counter' });
    this.actions.setHandler(this);
  }
  increment() {
    this.state.update((s) => {
      s.count += 1;
    });
    this.events.emit('changed');
  }
}

class LoggerService extends Service<ILogger> {
  readonly log = vi.fn();
  constructor() {
    super(undefined, { name: 'logger' });
    this.actions.setHandler('log', this.log);
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

      class OrderedService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'ordered' });
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
      app.start();
      await app.waitForStart();

      expect(calls).toEqual(['init', 'start', 'afterStart']);
    });

    it('completes all services in one phase before moving to the next', async () => {
      const calls: string[] = [];

      class PhaseService extends Service<ICounter> {
        constructor(private id: string) {
          super({ count: 0 }, { name: id });
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
      app.start();
      await app.waitForStart();

      expect(calls).toEqual(['a:init', 'b:init', 'a:start', 'b:start']);
    });

    it('awaits async lifecycle methods', async () => {
      const calls: string[] = [];

      class AsyncService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'async' });
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
      app.start();
      await app.waitForStart();

      expect(calls).toEqual(['init', 'start']);
    });
  });

  //-------------------------------------------------------
  //-- lifecycle — stop
  //-------------------------------------------------------

  describe('stop()', () => {
    it('calls onServiceBeforeStop → onServiceStop in order', async () => {
      const calls: string[] = [];

      class StopService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'stop' });
        }
        onServiceBeforeStop() {
          calls.push('beforeStop');
        }
        onServiceStop() {
          calls.push('stop');
        }
      }

      const app = createModule<ModuleDescriptor>({ counter: new StopService() });
      app.start();
      await app.waitForStart();
      app.stop();
      await app.waitForStop();

      expect(calls).toEqual(['beforeStop', 'stop']);
    });

    it('completes all services in beforeStop before any service runs stop', async () => {
      const calls: string[] = [];

      class StopPhaseService extends Service<ICounter> {
        constructor(private id: string) {
          super({ count: 0 }, { name: id });
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
      app.start();
      await app.waitForStart();
      app.stop();
      await app.waitForStop();

      expect(calls).toEqual(['a:beforeStop', 'b:beforeStop', 'a:stop', 'b:stop']);
    });
  });

  //-------------------------------------------------------
  //-- module.state
  //-------------------------------------------------------

  describe('module.state', () => {
    it('isStarted is false before start()', () => {
      const app = createModule({ counter: new CounterService() });
      expect(app.state.get().isStarted).toBe(false);
    });

    it('isStarted becomes true after start()', async () => {
      const app = createModule({ counter: new CounterService() });
      app.start();
      await app.waitForStart();
      expect(app.state.get().isStarted).toBe(true);
    });

    it('isStarted becomes false after stop()', async () => {
      const app = createModule({ counter: new CounterService() });
      app.start();
      await app.waitForStart();
      app.stop();
      await app.waitForStop();
      expect(app.state.get().isStarted).toBe(false);
    });

    it('notifies subscribers when isStarted changes', async () => {
      const app = createModule({ counter: new CounterService() });
      const listener = vi.fn();
      app.state.subscribe(listener);
      app.start();
      await app.waitForStart();
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ isStarted: true }),
        expect.anything(),
      );
    });
  });

  //-------------------------------------------------------
  //-- module.events
  //-------------------------------------------------------

  describe('module.events', () => {
    it('emits "started" after start() completes', async () => {
      const app = createModule({ counter: new CounterService() });
      const listener = vi.fn();
      app.events.on('started', listener);
      app.start();
      await app.waitForStart();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('emits "stopped" after stop() completes', async () => {
      const app = createModule({ counter: new CounterService() });
      const listener = vi.fn();
      app.events.on('stopped', listener);
      app.start();
      await app.waitForStart();
      app.stop();
      await app.waitForStop();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('"started" fires after all services have completed afterStart', async () => {
      const calls: string[] = [];

      class TrackedService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'tracked' });
        }
        onServiceAfterStart() {
          calls.push('afterStart');
        }
      }

      const app = createModule({ counter: new TrackedService() });
      app.events.on('started', () => calls.push('started'));
      app.start();
      await app.waitForStart();

      expect(calls).toEqual(['afterStart', 'started']);
    });

    it('"started" fires after isStarted is true', async () => {
      const app = createModule({ counter: new CounterService() });
      let isStartedOnEvent = false;
      app.events.on('started', () => {
        isStartedOnEvent = app.state.get().isStarted;
      });
      app.start();
      await app.waitForStart();
      expect(isStartedOnEvent).toBe(true);
    });

    it('emits "errorStarting" and default-logs when a service throws during start', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class BrokenService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'broken' });
        }
        onServiceInit() {
          throw new Error('boom');
        }
      }

      const app = createModule({ counter: new BrokenService() });
      // use wildcard so errorStarting's default handler still fires (no real listener on the event)
      await new Promise<void>((resolve) => {
        app.events.on('*', (event) => {
          if (event === 'errorStarting') resolve();
        });
        app.start();
      });

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does not use the default error log when a listener is registered for errorStarting', async () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

      class BrokenService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'broken' });
        }
        onServiceInit() {
          throw new Error('boom');
        }
      }

      const app = createModule({ counter: new BrokenService() });
      const errorListener = vi.fn();
      app.events.on('errorStarting', errorListener);
      app.start();
      // errorListener is a real listener so the default handler won't fire;
      // wait via wildcard to avoid adding another real errorStarting listener
      await new Promise<void>((resolve) => {
        app.events.on('*', (event) => {
          if (event === 'errorStarting') resolve();
        });
      });

      expect(errorListener).toHaveBeenCalledTimes(1);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  //-------------------------------------------------------
  //-- waitForStart / waitForStop
  //-------------------------------------------------------

  describe('waitForStart() / waitForStop()', () => {
    it('waitForStart() resolves after start completes', async () => {
      const app = createModule({ counter: new CounterService() });
      app.start();
      await expect(app.waitForStart()).resolves.toBeUndefined();
    });

    it('waitForStart() resolves immediately if already started', async () => {
      const app = createModule({ counter: new CounterService() });
      app.start();
      await app.waitForStart();
      await expect(app.waitForStart()).resolves.toBeUndefined();
    });

    it('waitForStop() resolves after stop completes', async () => {
      const app = createModule({ counter: new CounterService() });
      app.start();
      await app.waitForStart();
      app.stop();
      await expect(app.waitForStop()).resolves.toBeUndefined();
    });

    it('waitForStop() resolves immediately if already stopped', async () => {
      const app = createModule({ counter: new CounterService() });
      await expect(app.waitForStop()).resolves.toBeUndefined();
    });

    it('waitForStart() rejects if a service throws during start', async () => {
      class BrokenService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'broken' });
        }
        onServiceInit() {
          throw new Error('boom');
        }
      }

      const app = createModule({ counter: new BrokenService() });
      app.events.on('errorStarting', () => {}); // suppress default log
      app.start();
      await expect(app.waitForStart()).rejects.toThrow('boom');
    });
  });

  //-------------------------------------------------------
  //-- module.client
  //-------------------------------------------------------

  describe('client()', () => {
    it('returns a client with state, events, and services', () => {
      const app = createModule({ counter: new CounterService() });
      const client = app.client;
      expect(client.state).toBeDefined();
      expect(client.events).toBeDefined();
      expect(client.services).toBeDefined();
    });

    it('client state reflects module lifecycle', async () => {
      const app = createModule({ counter: new CounterService() });
      const client = app.client;
      expect(client.state.get().isStarted).toBe(false);
      app.start();
      await app.waitForStart();
      expect(client.state.get().isStarted).toBe(true);
    });

    it('client events fire when module lifecycle events fire', async () => {
      const app = createModule({ counter: new CounterService() });
      const client = app.client;
      const listener = vi.fn();
      client.events.on('started', listener);
      app.start();
      await app.waitForStart();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('client does not expose start or stop', () => {
      const app = createModule({ counter: new CounterService() });
      const client = app.client;
      expect((client as unknown as Record<string, unknown>)['start']).toBeUndefined();
      expect((client as unknown as Record<string, unknown>)['stop']).toBeUndefined();
    });

    it('client services are the same as module services', () => {
      const app = createModule({ counter: new CounterService() });
      const client = app.client;
      expect(client.services.counter).toBe(app.services.counter);
    });
  });

  //-------------------------------------------------------
  //-- lifecycle guards & mutex
  //-------------------------------------------------------

  describe('lifecycle guards', () => {
    it('double start() is a no-op — lifecycle runs only once', async () => {
      const calls: string[] = [];

      class TrackedService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'tracked' });
        }
        onServiceInit() {
          calls.push('init');
        }
      }

      const app = createModule({ counter: new TrackedService() });
      app.start();
      app.start();
      await app.waitForStart();
      expect(calls).toEqual(['init']);
    });

    it('double stop() is a no-op', async () => {
      const calls: string[] = [];

      class TrackedService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'tracked' });
        }
        onServiceStop() {
          calls.push('stop');
        }
      }

      const app = createModule({ counter: new TrackedService() });
      app.start();
      await app.waitForStart();
      app.stop();
      app.stop();
      await app.waitForStop();
      expect(calls).toEqual(['stop']);
    });

    it('stop() called concurrently with start() waits for start to finish first', async () => {
      const calls: string[] = [];

      class SlowService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'slow' });
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
      const stoppedPromise = new Promise<void>((resolve) => app.events.on('stopped', resolve));
      app.start();
      app.stop(); // queued behind start
      await stoppedPromise;
      expect(calls).toEqual(['init', 'stop']);
    });
  });

  //-------------------------------------------------------
  //-- verbose
  //-------------------------------------------------------

  describe('verbose option', () => {
    it('logs each lifecycle phase when verbose is true', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      class SimpleService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'simple' });
        }
      }

      const app = createModule({ counter: new SimpleService() }, { verbose: true });
      app.start();
      await app.waitForStart();

      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('does not log when verbose is false', async () => {
      const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

      class SimpleService extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'simple' });
        }
      }

      const app = createModule({ counter: new SimpleService() }, { verbose: false });
      app.start();
      await app.waitForStart();

      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});

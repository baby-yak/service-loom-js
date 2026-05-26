import { describe, expect, it, vi } from 'vitest';
import { createModule } from '../modules/moduleFactory.js';
import { Service } from '../services/service.js';
import { createService } from '../services/serviceFactory.js';

// ---------------------------------------------------------------------------
// Shared test descriptors
// ---------------------------------------------------------------------------

type ICounter = {
  state: { count: number };
  events: { changed: () => void };
  actions: { increment(): void; add(n: number): number };
};

type IStateless = {
  actions: { ping(): string };
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

  add(n: number) {
    this.state.update((s) => {
      s.count += n;
    });
    return this.state.get().count;
  }
}

class StatelessService extends Service<IStateless> {
  constructor() {
    super(undefined);
    this.actions.setHandler('ping', () => 'pong');
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

describe('Service', () => {
  //-------------------------------------------------------
  //-- construction
  //-------------------------------------------------------

  describe('construction', () => {
    it('stores the name', () => {
      const s = new CounterService();
      expect(s.name).toBe('counter');
    });

    it('initializes state with the given value', () => {
      const s = new CounterService();
      expect(s.state.get().count).toBe(0);
    });

    it('supports undefined state when no state in descriptor', () => {
      const s = new StatelessService();
      expect(s.state.get()).toBeUndefined();
    });

    it('expose invoke as shorthand for the action client', () => {
      const s = new CounterService();
      expect(s.invoke).toBe(s.actions.invoke);
    });
  });

  //-------------------------------------------------------
  //-- client
  //-------------------------------------------------------

  describe('client', () => {
    it('client with state, events, and actions', () => {
      const client = new CounterService().client;
      expect(client.state).toBeDefined();
      expect(client.events).toBeDefined();
      expect(client.actions).toBeDefined();
    });

    it('client state reflects service state updates', () => {
      const s = new CounterService();
      const client = s.client;
      s.state.update((d) => {
        d.count = 42;
      });
      expect(client.state.get().count).toBe(42);
    });

    it('client can subscribe to state changes', () => {
      const s = new CounterService();
      const client = s.client;
      const listener = vi.fn();
      client.state.subscribe(listener);
      s.invoke.increment();
      // subscribe fires immediately (initial state), then again on each update
      // listener receives (newState, prevState)
      expect(listener).toHaveBeenLastCalledWith(
        expect.objectContaining({ count: 1 }),
        expect.anything(),
      );
    });

    it('client receives events emitted by the service', () => {
      const s = new CounterService();
      const client = s.client;
      const listener = vi.fn();
      client.events.on('changed', listener);
      s.invoke.increment();
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('client can invoke actions', () => {
      const s = new CounterService();
      const client = s.client;
      client.actions.invoke.increment();
      expect(s.state.get().count).toBe(1);
    });

    it('client action return values are preserved', () => {
      const s = new CounterService();
      const client = s.client;
      const result = client.actions.invoke.add(5);
      expect(result).toBe(5);
    });

    it('client.invoke is shorthand for client.actions.invoke', () => {
      const s = new CounterService();
      const client = s.client;
      client.invoke.increment();
      expect(s.state.get().count).toBe(1);
    });
  });

  //-------------------------------------------------------
  //-- this.invoke inside the service
  //-------------------------------------------------------

  describe('this.invoke', () => {
    it('calls through to registered handlers', () => {
      const s = new CounterService();
      s.invoke.increment();
      expect(s.state.get().count).toBe(1);
    });
  });
});

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// createService
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

describe('createService()', () => {
  //-------------------------------------------------------
  //-- construction
  //-------------------------------------------------------

  describe('construction', () => {
    it('stores the name', () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      expect(s.name).toBe('Counter');
    });

    it('initializes state with the given value', () => {
      const s = createService<ICounter>({ count: 7 }, { name: 'Counter' });
      expect(s.state.get().count).toBe(7);
    });

    it('supports undefined state when no state in descriptor', () => {
      const s = createService<IStateless>(undefined);
      expect(s.state.get()).toBeUndefined();
    });
 
    it('client returns a client with state, events, and actions', () => {
      const client = createService<ICounter>({ count: 0 }, { name: 'Counter' }).client;
      expect(client.state).toBeDefined();
      expect(client.events).toBeDefined();
      expect(client.actions).toBeDefined();
    });

    it('actions and events work the same as OOP style', () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      const listener = vi.fn();
      s.actions.setHandler('increment', () => {
        s.state.update((d) => {
          d.count += 1;
        });
        s.events.emit('changed');
      });
      s.client.events.on('changed', listener);
      s.invoke.increment();
      expect(s.state.get().count).toBe(1);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  //-------------------------------------------------------
  //-- lifecycle callbacks
  //-------------------------------------------------------
  // type ModuleDescriptor = {
  //   s: ICounter;
  // };

  describe('lifecycle callbacks', () => {
    it('onInit is called during module.start()', async () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      const onInit = vi.fn();
      s.onServiceInit = onInit;
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      expect(onInit).toHaveBeenCalledTimes(1);
    });

    it('onStart is called during module.start()', async () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      const onStart = vi.fn();
      s.onServiceStart = onStart;
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      expect(onStart).toHaveBeenCalledTimes(1);
    });

    it('onAfterStart is called during module.start()', async () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      const onAfterStart = vi.fn();
      s.onServiceAfterStart = onAfterStart;
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      expect(onAfterStart).toHaveBeenCalledTimes(1);
    });

    it('onBeforeStop is called during module.stop()', async () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      const onBeforeStop = vi.fn();
      s.onServiceBeforeStop = onBeforeStop;
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      app.stop();
      await app.waitForStop();
      expect(onBeforeStop).toHaveBeenCalledTimes(1);
    });

    it('onStop is called during module.stop()', async () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      const onStop = vi.fn();
      s.onServiceStop = onStop;
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      app.stop();
      await app.waitForStop();
      expect(onStop).toHaveBeenCalledTimes(1);
    });

    it('all five callbacks fire in correct phase order', async () => {
      const calls: string[] = [];
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      s.onServiceInit = () => {
        calls.push('init');
      };
      s.onServiceStart = () => {
        calls.push('start');
      };
      s.onServiceAfterStart = () => {
        calls.push('afterStart');
      };
      s.onServiceBeforeStop = () => {
        calls.push('beforeStop');
      };
      s.onServiceStop = () => {
        calls.push('stop');
      };
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      app.stop();
      await app.waitForStop();
      expect(calls).toEqual(['init', 'start', 'afterStart', 'beforeStop', 'stop']);
    });

    it('async callbacks are awaited before the next phase', async () => {
      const calls: string[] = [];
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      s.onServiceInit = async () => {
        await Promise.resolve();
        calls.push('init');
      };
      s.onServiceStart = () => {
        calls.push('start');
      };
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      expect(calls).toEqual(['init', 'start']);
    });

    it('unassigned callbacks are no-ops — no throw', async () => {
      const s = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      const app = createModule({ s });
      app.start();
      await expect(app.waitForStart()).resolves.toBeUndefined();
    });
  });

  //-------------------------------------------------------
  //-- getModule
  //-------------------------------------------------------

  describe('getModule', () => {
    it('throws before onServiceStart', () => {
      class S extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 's' });
        }
        override onServiceInit() {
          expect(() => this.getModule()).toThrow('onServiceStart');
        }
      }
      const s = new S();
      const app = createModule({ s });
      app.start();
      return app.waitForStart();
    });

    it('returns module client from onServiceStart onward', async () => {
      let mod: unknown;
      class S extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'counter' });
        }
        override onServiceStart() {
          mod = this.getModule();
        }
      }
      const s = new S();
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      expect(mod).toBeDefined();
    });

    it('returned client has access to sibling services', async () => {
      type AppModule = { a: Service<ICounter>; b: Service<ICounter> };
      let siblingState: unknown;
      class A extends Service<ICounter> {
        constructor() {
          super({ count: 42 }, { name: 'counter' });
        }
      }
      class B extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'counter' });
        }
        override onServiceStart() {
          siblingState = this.getModule<AppModule>().services.a.state.get();
        }
      }
      const app = createModule({ a: new A(), b: new B() });
      app.start();
      await app.waitForStart();
      expect(siblingState).toEqual({ count: 42 });
    });

    it('module client is the same instance as module.client', async () => {
      let mod: unknown;
      class S extends Service<ICounter> {
        constructor() {
          super({ count: 0 });
        }
        override onServiceStart() {
          mod = this.getModule();
        }
      }
      const s = new S();
      const app = createModule({ s });
      app.start();
      await app.waitForStart();
      expect(mod).toBe(app.client);
    });
  });

  //-------------------------------------------------------
  //-- interop with OOP services
  //-------------------------------------------------------

  describe('interop', () => {
    it('works alongside OOP services in the same Module', async () => {
      const calls: string[] = [];

      class OopCounter extends Service<ICounter> {
        constructor() {
          super({ count: 0 }, { name: 'oop' });
        }
        onServiceInit() {
          calls.push('oop:init');
        }
        onServiceStart() {
          calls.push('oop:start');
        }
      }

      const composed = createService<ICounter>({ count: 0 }, { name: 'Counter' });
      composed.onServiceInit = () => {
        calls.push('composed:init');
      };
      composed.onServiceStart = () => {
        calls.push('composed:start');
      };

      const app = createModule<{ oop: Service<ICounter>; composed: Service<ICounter> }>({
        oop: new OopCounter(),
        composed,
      });
      app.start();
      await app.waitForStart();

      expect(calls).toEqual(['oop:init', 'composed:init', 'oop:start', 'composed:start']);
    });
  });
});

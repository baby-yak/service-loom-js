import { describe, expect, it, vi } from 'vitest';
import { Service } from '../services/service.js';
import type { ServiceDescriptor } from '../services/types.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
import type {
  ActionsOf,
  ActionsOfWithFallback,
  EventsOf,
  EventsOfWithFallback,
  StateOf,
  StateOfWithFallback,
} from '../services/internal/types.js';
import type { Empty } from '../core/types.js';

// ---------------------------------------------------------------------------
// Shared test descriptors
// ---------------------------------------------------------------------------

type ICounter = ServiceDescriptor<{
  state: { count: number };
  events: { changed: () => void };
  actions: { increment(): void; add(n: number): number };
}>;

type IStateless = ServiceDescriptor<{
  actions: { ping(): string };
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

  add(n: number) {
    this.state.update((s) => {
      s.count += n;
    });
    return this.state.get().count;
  }
}

class StatelessService extends Service<IStateless> implements IStateless {
  constructor() {
    super('stateless', undefined);

    this.state.get();
  }
  ping(): string {
    return 'pong';
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
      s.actions.invoke.increment();
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
      s.actions.invoke.increment();
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
      client.actions.invoke.increment();
      expect(s.state.get().count).toBe(1);
    });
  });

  //-------------------------------------------------------
  //-- this.invoke inside the service
  //-------------------------------------------------------

  describe('this.invoke', () => {
    it('calls through to registered handlers', () => {
      const s = new CounterService();
      s.actions.invoke.increment();
      expect(s.state.get().count).toBe(1);
    });
  });
});

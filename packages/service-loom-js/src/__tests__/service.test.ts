import { describe, expect, it, vi } from 'vitest';
import { Service } from '../services/service.js';
import type { ServiceDescriptor } from '../services/types.js';
import type {
  ActionsOf,
  ActionsOfWithFallback,
  EventsOf,
  EventsOfWithFallback,
  StateOf,
  StateOfWithFallback,
} from '../services/internal/types.js';

// ---------------------------------------------------------------------------
// Shared descriptors
// ---------------------------------------------------------------------------

type ICounter = ServiceDescriptor<{
  state: { count: number };
  events: { changed: () => void };
  actions: { increment(): void; add(n: number): number };
}>;

type IStateless = ServiceDescriptor<{
  actions: { ping(): string };
}>;

type IEventOnly = ServiceDescriptor<{
  events: { tick: () => void };
}>;

type IActionOnly = ServiceDescriptor<{
  actions: { noop(): void };
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
  // -------------------------------------------------------------------------
  // construction
  // -------------------------------------------------------------------------
  describe('construction', () => {
    it('stores the name', () => {
      expect(new CounterService().name).toBe('counter');
    });

    it('allows undefined name', () => {
      class AnonService extends Service<IActionOnly> implements IActionOnly {
        constructor() {
          super(undefined);
        }
        noop() {}
      }
      expect(new AnonService().name).toBeUndefined();
    });

    it('initializes state with the given value', () => {
      expect(new CounterService().state.get().count).toBe(0);
    });

    it('state.get() returns undefined when no state is declared', () => {
      expect(new StatelessService().state.get()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // state (direct on service)
  // -------------------------------------------------------------------------
  describe('state', () => {
    it('update() via immer recipe changes state', () => {
      const s = new CounterService();
      s.state.update((d) => {
        d.count = 5;
      });
      expect(s.state.get().count).toBe(5);
    });

    it('subscribe() fires immediately with current state', () => {
      const s = new CounterService();
      const fn = vi.fn();
      s.state.subscribe(fn);
      expect(fn).toHaveBeenCalledWith({ count: 0 }, undefined);
    });

    it('subscribe() fires again on each update', () => {
      const s = new CounterService();
      const fn = vi.fn();
      s.state.subscribe(fn);
      fn.mockClear();
      s.increment();
      expect(fn).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
    });
  });

  // -------------------------------------------------------------------------
  // events (direct on service)
  // -------------------------------------------------------------------------
  describe('events', () => {
    it('on() receives emissions from the same service', () => {
      const s = new CounterService();
      const fn = vi.fn();
      s.events.on('changed', fn);
      s.increment();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('off() removes the listener', () => {
      const s = new CounterService();
      const fn = vi.fn();
      s.events.on('changed', fn);
      s.events.off('changed', fn);
      s.increment();
      expect(fn).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // actions.invoke (this.actions inside the service)
  // -------------------------------------------------------------------------
  describe('actions.invoke', () => {
    it('dispatches to this (the service instance)', () => {
      const s = new CounterService();
      s.actions.invoke.increment();
      expect(s.state.get().count).toBe(1);
    });

    it('return values propagate back', () => {
      const s = new CounterService();
      expect(s.actions.invoke.add(7)).toBe(7);
    });

    it('accumulates across multiple invocations', () => {
      const s = new CounterService();
      s.actions.invoke.increment();
      s.actions.invoke.increment();
      expect(s.state.get().count).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // client
  // -------------------------------------------------------------------------
  describe('client', () => {
    it('client.name mirrors service name', () => {
      expect(new CounterService().client.name).toBe('counter');
    });

    it('client.state.get() reflects current service state', () => {
      const s = new CounterService();
      s.state.update((d) => {
        d.count = 42;
      });
      expect(s.client.state.get().count).toBe(42);
    });

    it('client.state.subscribe() fires when service state changes', () => {
      const s = new CounterService();
      const fn = vi.fn();
      s.client.state.subscribe(fn);
      fn.mockClear();
      s.actions.invoke.increment();
      expect(fn).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
    });

    it('client.events.on() receives emissions from the service', () => {
      const s = new CounterService();
      const fn = vi.fn();
      s.client.events.on('changed', fn);
      s.actions.invoke.increment();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('client.actions dispatches to service handler', () => {
      const s = new CounterService();
      s.client.actions.increment();
      expect(s.state.get().count).toBe(1);
    });

    it('client.actions return values are preserved', () => {
      const s = new CounterService();
      expect(s.client.actions.add(5)).toBe(5);
    });

    it('client.state.get() is undefined for no-state service', () => {
      expect(new StatelessService().client.state.get()).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // type extractors (compile-time assertions; runtime anchors only)
  // -------------------------------------------------------------------------
  describe('type extractors', () => {
    it('ActionsOf<ICounter> is the actions map', () => {
      const _: ActionsOf<ICounter> = { increment: () => {}, add: () => 0 };
      expect(_).toBeDefined();
    });

    it('StateOf<ICounter> is the state shape', () => {
      const _: StateOf<ICounter> = { count: 0 };
      expect(_).toBeDefined();
    });

    it('EventsOf<ICounter> is the events map', () => {
      const _: EventsOf<ICounter> = { changed: () => {} };
      expect(_).toBeDefined();
    });

    it('ActionsOf returns undefined for a descriptor with no actions', () => {
      const _: ActionsOf<IEventOnly> = undefined;
      expect(_).toBeUndefined();
    });

    it('StateOf returns undefined for a descriptor with no state', () => {
      const _: StateOf<IStateless> = undefined;
      expect(_).toBeUndefined();
    });

    it('EventsOf returns undefined for a descriptor with no events', () => {
      const _: EventsOf<IStateless> = undefined;
      expect(_).toBeUndefined();
    });

    it('ActionsOfWithFallback returns Empty ({}) for a descriptor with no actions', () => {
      const _: ActionsOfWithFallback<IEventOnly> = {};
      expect(_).toBeDefined();
    });

    it('StateOfWithFallback is undefined (no lie) for a descriptor with no state', () => {
      const _: StateOfWithFallback<IStateless> = undefined;
      expect(_).toBeUndefined();
    });

    it('EventsOfWithFallback returns Empty ({}) for a descriptor with no events', () => {
      const _: EventsOfWithFallback<IActionOnly> = {};
      expect(_).toBeDefined();
    });
  });
});

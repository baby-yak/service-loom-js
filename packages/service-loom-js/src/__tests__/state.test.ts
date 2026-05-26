import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ReactiveState } from '../reactiveState/reactiveState.js';

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ReactiveState
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

describe('ReactiveState', () => {
  //-------------------------------------------------------
  //-- GET
  //-------------------------------------------------------

  describe('get', () => {
    it('returns the initial state', () => {
      const s = new ReactiveState({ x: 1 });
      expect(s.get()).toEqual({ x: 1 });
    });
  });

  //-------------------------------------------------------
  //-- GET INITIAL STATE
  //-------------------------------------------------------

  describe('getInitialState', () => {
    it('returns the initial value after state has changed', () => {
      const s = new ReactiveState({ x: 1 });
      s.set({ x: 99 });
      expect(s.get()).toEqual({ x: 99 });
      expect(s.getInitialState()).toEqual({ x: 1 });
    });

    it('returns the same value as get() before any changes', () => {
      const s = new ReactiveState({ x: 1 });
      expect(s.getInitialState()).toEqual(s.get());
    });

    it('is available on a client facade', () => {
      const s = new ReactiveState({ x: 1 });
      const source = s.client;
      s.set({ x: 99 });
      expect(source.getInitialState()).toEqual({ x: 1 });
    });
  });

  //-------------------------------------------------------
  //-- SET
  //-------------------------------------------------------

  describe('set', () => {
    it('updates state', () => {
      const s = new ReactiveState({ x: 1 });
      s.set({ x: 2 });
      expect(s.get()).toEqual({ x: 2 });
    });

    it('notifies listeners', () => {
      const s = new ReactiveState({ x: 1 });
      const fn = vi.fn();
      s.subscribe(fn);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith({ x: 1 }, undefined);

      fn.mockClear();

      s.set({ x: 2 });
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith({ x: 2 }, { x: 1 });
    });

    it('does not notify when reference is unchanged (Object.is)', () => {
      const state = { x: 1 };
      const s = new ReactiveState(state);
      const fn = vi.fn();
      s.subscribe(fn);
      fn.mockClear();

      s.set(state);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  //-------------------------------------------------------
  //-- subscribe
  //-------------------------------------------------------

  describe('subscribe', () => {
    it('calls listener immediately with prev = undefined', () => {
      const s = new ReactiveState({ x: 1 });
      const fn = vi.fn();
      s.subscribe(fn);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith({ x: 1 }, undefined);
    });

    it('calls listener with current and previous state on change', () => {
      const s = new ReactiveState({ x: 1 });
      const fn = vi.fn();
      s.subscribe(fn);
      fn.mockClear();

      s.set({ x: 2 });
      expect(fn).toHaveBeenCalledWith({ x: 2 }, { x: 1 });
    });

    it('returns an unsubscribe function that stops notifications', () => {
      const s = new ReactiveState({ x: 1 });
      const fn = vi.fn();
      const unsub = s.subscribe(fn);
      fn.mockClear();

      unsub();
      s.set({ x: 2 });
      expect(fn).not.toHaveBeenCalled();
    });

    it('handles unsubscribe during notification (snapshot)', () => {
      const s = new ReactiveState({ x: 1 });
      let unsub: (() => void) | undefined = undefined;
      const fn = vi.fn(() => unsub?.());
      unsub = s.subscribe(fn);
      fn.mockClear();

      expect(() => {
        s.set({ x: 2 });
      }).not.toThrow();
      expect(fn).toHaveBeenCalledOnce();
    });

    it('multiple listeners all receive the update', () => {
      const s = new ReactiveState(0);
      const a = vi.fn();
      const b = vi.fn();
      s.subscribe(a);
      s.subscribe(b);
      a.mockClear();
      b.mockClear();

      s.set(1);
      expect(a).toHaveBeenCalledOnce();
      expect(b).toHaveBeenCalledOnce();
    });

    it('calling unsub twice does not throw', () => {
      const s = new ReactiveState({ x: 1 });
      const unsub = s.subscribe(() => {});
      unsub();
      expect(() => {
        unsub();
      }).not.toThrow();
    });
  });

  //-------------------------------------------------------
  //-- update
  //-------------------------------------------------------

  describe('update', () => {
    it('shallow-merges a Partial', () => {
      const s = new ReactiveState({ x: 1, y: 2 });
      s.update({ x: 9 });
      expect(s.get()).toEqual({ x: 9, y: 2 });
    });

    it('deep-mutates via immer recipe', () => {
      const s = new ReactiveState({ a: { x: 1, y: 2 } });
      s.update((draft) => {
        draft.a.x = 9;
      });
      expect(s.get()).toEqual({ a: { x: 9, y: 2 } });
    });

    it('replaces array state with Partial value', () => {
      const s = new ReactiveState([1, 2, 3]);
      s.update([9, 9, 9]);
      expect(s.get()).toEqual([9, 9, 9]);
    });

    it('throws when using a recipe on primitive state', () => {
      const s = new ReactiveState(42 as unknown as object);
      expect(() => {
        s.update(() => {});
      }).toThrow('set()');
    });

    it('mutates Map state via immer recipe', () => {
      const s = new ReactiveState(new Map([['a', 1]]));
      s.update((draft) => {
        draft.set('b', 2);
      });
      expect(s.get().get('a')).toBe(1);
      expect(s.get().get('b')).toBe(2);
    });

    it('mutates Set state via immer recipe', () => {
      const s = new ReactiveState(new Set([1, 2]));
      s.update((draft) => {
        draft.add(3);
      });
      expect(s.get().has(1)).toBe(true);
      expect(s.get().has(3)).toBe(true);
    });

    it('does not notify when immer recipe produces no change', () => {
      const s = new ReactiveState({ x: 1 });
      const fn = vi.fn();
      s.subscribe(fn);
      fn.mockClear();

      s.update(() => {
        // no mutation
      });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  //-------------------------------------------------------
  //-- error handling
  //-------------------------------------------------------

  describe('error handling', () => {
    let consoleSpy: {
      warn: ReturnType<typeof vi.spyOn>;
      log: ReturnType<typeof vi.spyOn>;
      error: ReturnType<typeof vi.spyOn>;
    };

    beforeEach(() => {
      consoleSpy = {
        warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
        log: vi.spyOn(console, 'log').mockImplementation(() => {}),
        error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      };
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const throwingListener = () => {
      throw new Error('boom');
    };

    it('warn (default) — logs to console.warn and does not rethrow', () => {
      const s = new ReactiveState(0);
      s.subscribe(throwingListener);
      expect(consoleSpy.warn).toHaveBeenCalled();
    });

    it('ignore — silently swallows the error', () => {
      const s = new ReactiveState(0, { listenersErrorHandling: 'ignore' });
      s.subscribe(throwingListener);
      expect(consoleSpy.warn).not.toHaveBeenCalled();
      expect(consoleSpy.log).not.toHaveBeenCalled();
      expect(consoleSpy.error).not.toHaveBeenCalled();
    });

    it('log — logs to console.log', () => {
      const s = new ReactiveState(0, { listenersErrorHandling: 'log' });
      s.subscribe(throwingListener);
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('error — logs to console.error', () => {
      const s = new ReactiveState(0, { listenersErrorHandling: 'error' });
      s.subscribe(throwingListener);
      expect(consoleSpy.error).toHaveBeenCalled();
    });

    it('throw — rethrows the error', () => {
      const s = new ReactiveState(0, { listenersErrorHandling: 'throw' });
      expect(() => s.subscribe(throwingListener)).toThrow('boom');
    });

    it('function — calls the provided handler', () => {
      const handler = vi.fn();
      const s = new ReactiveState(0, { listenersErrorHandling: handler });
      s.subscribe(throwingListener);
      expect(handler).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  //-------------------------------------------------------
  //-------------------------------------------------------
  //-- client
  //-------------------------------------------------------
  //-------------------------------------------------------

  describe('client', () => {
    it('returned StateSource reflects state changes', () => {
      const s = new ReactiveState({ x: 1 });
      const source = s.client;

      s.set({ x: 2 });
      expect(source.get()).toEqual({ x: 2 });
    });

    it('returned StateSource notifies on change', () => {
      const s = new ReactiveState({ x: 1 });
      const source = s.client;
      const fn = vi.fn();
      source.subscribe(fn);
      fn.mockClear();

      s.set({ x: 2 });
      expect(fn).toHaveBeenCalledOnce();
    });

    it('select() works on a StateSource facade', () => {
      const s = new ReactiveState({ x: 1, y: 0 });
      const source = s.client;
      const sel = source.select((state) => state.x);
      const fn = vi.fn();
      sel.subscribe(fn);
      fn.mockClear();

      s.set({ x: 2, y: 0 });
      expect(fn).toHaveBeenCalledWith(2, 1);

      s.set({ x: 2, y: 99 }); // x unchanged — no notification
      expect(fn).toHaveBeenCalledOnce();
    });
  });
});

// ---------------------------------------------------------------------------
// ReactiveState updatePure option
// ---------------------------------------------------------------------------
describe('ReactiveStatePure', () => {
  it('shallow-merges a Partial on plain object state', () => {
    const s = new ReactiveState({ x: 1, y: 2 });
    s.updatePure({ x: 9 });
    expect(s.get()).toEqual({ x: 9, y: 2 });
  });

  it('applies a pure reducer function', () => {
    const s = new ReactiveState({ x: 1, y: 2 });
    s.updatePure((state) => ({ ...state, x: state.x + 1 }));
    expect(s.get()).toEqual({ x: 2, y: 2 });
  });

  it('replaces non-object state via Partial', () => {
    const s = new ReactiveState([1, 2, 3]);
    s.updatePure([9, 9, 9]);
    expect(s.get()).toEqual([9, 9, 9]);
  });

  it('does not notify when reducer returns same reference', () => {
    const state = { x: 1 };
    const s = new ReactiveState(state);
    const fn = vi.fn();
    s.subscribe(fn);
    fn.mockClear();

    s.updatePure(() => state);
    expect(fn).not.toHaveBeenCalled();
  });

  it('subscribe, select, client all work', () => {
    const s = new ReactiveState({ x: 1, y: 0 });
    const sel = s.select((st) => st.x);
    const fn = vi.fn();
    sel.subscribe(fn);
    fn.mockClear();

    s.updatePure({ x: 2 });
    expect(fn).toHaveBeenCalledWith(2, 1);
    expect(s.client.get()).toEqual({ x: 2, y: 0 });
  });
});

// ---------------------------------------------------------------------------
// StateSelector (via ReactiveState.select)
// ---------------------------------------------------------------------------

describe('StateSelector', () => {
  //-------------------------------------------------------
  //-- StateSelector:get
  //-------------------------------------------------------
  describe('get', () => {
    it('returns the selected value', () => {
      const s = new ReactiveState({ x: 1, y: 2 });
      const sel = s.select((state) => state.x);
      expect(sel.get()).toBe(1);
    });
  });

  //-------------------------------------------------------
  //-- StateSelector:getInitialState
  //-------------------------------------------------------

  describe('getInitialState', () => {
    it('returns the initial selected value after state has changed', () => {
      const s = new ReactiveState({ x: 1, y: 0 });
      const sel = s.select((state) => state.x);
      s.set({ x: 99, y: 0 });
      expect(sel.get()).toBe(99);
      expect(sel.getInitialState()).toBe(1);
    });

    it('works on chained selectors', () => {
      const s = new ReactiveState({ a: { b: 42 } });
      const sel = s.select((state) => state.a).select((a) => a.b);
      s.update((draft) => {
        draft.a.b = 0;
      });
      expect(sel.getInitialState()).toBe(42);
    });
  });
  //-------------------------------------------------------
  //-- StateSelector:subscribe
  //-------------------------------------------------------
  describe('subscribe', () => {
    it('calls listener immediately with prev = undefined', () => {
      const s = new ReactiveState({ x: 1 });
      const sel = s.select((state) => state.x);
      const fn = vi.fn();
      sel.subscribe(fn);
      expect(fn).toHaveBeenCalledOnce();
      expect(fn).toHaveBeenCalledWith(1, undefined);
    });

    it('calls listener when selected value changes', () => {
      const s = new ReactiveState({ x: 1, y: 0 });
      const sel = s.select((state) => state.x);
      const fn = vi.fn();
      sel.subscribe(fn);
      fn.mockClear();

      s.set({ x: 2, y: 0 });
      expect(fn).toHaveBeenCalledWith(2, 1);
    });

    it('skips notification when selected value is unchanged (Object.is)', () => {
      const s = new ReactiveState({ x: 1, y: 0 });
      const sel = s.select((state) => state.x);
      const fn = vi.fn();
      sel.subscribe(fn);
      fn.mockClear();

      s.set({ x: 1, y: 99 }); // y changed, x did not
      expect(fn).not.toHaveBeenCalled();
    });

    it('does not fire for NaN when NaN is unchanged', () => {
      const s = new ReactiveState({ v: NaN });
      const sel = s.select((state) => state.v);
      const fn = vi.fn();
      sel.subscribe(fn);
      fn.mockClear();

      s.set({ v: NaN });
      expect(fn).not.toHaveBeenCalled();
    });

    it('unsubscribe stops notifications', () => {
      const s = new ReactiveState({ x: 1 });
      const sel = s.select((state) => state.x);
      const fn = vi.fn();
      const unsub = sel.subscribe(fn);
      fn.mockClear();

      unsub();
      s.set({ x: 2 });
      expect(fn).not.toHaveBeenCalled();
    });
  });

  //-------------------------------------------------------
  //-- StateSelector:select (chained)
  //-------------------------------------------------------

  describe('select (chained)', () => {
    it('chains selectors correctly', () => {
      const s = new ReactiveState({ a: { b: 42 } });
      const sel = s.select((state) => state.a).select((a) => a.b);
      expect(sel.get()).toBe(42);
    });

    it('chained selector fires only when its value changes', () => {
      const s = new ReactiveState({ a: { b: 1 }, c: 0 });
      const sel = s.select((state) => state.a).select((a) => a.b);
      const fn = vi.fn();
      sel.subscribe(fn);
      fn.mockClear();

      s.update((draft) => {
        draft.c = 99;
      });
      expect(fn).not.toHaveBeenCalled();

      s.update((draft) => {
        draft.a.b = 2;
      });
      expect(fn).toHaveBeenCalledWith(2, 1);
    });
  });
});

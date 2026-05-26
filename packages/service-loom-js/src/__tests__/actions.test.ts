import { describe, expect, it, vi } from 'vitest';
import { ActionExecuter } from '../actions/actionExecuter.js';

type TestActions = {
  greet(name: string): string;
  add(a: number, b: number): number;
  noop(): void;
};

type AsyncActions = {
  fetchUser(id: number): Promise<{ id: number; name: string }>;
  delay(ms: number): Promise<void>;
};

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// ActionsExecuter
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------

describe('ActionsExecuter', () => {
  //-------------------------------------------------------
  //-- setHandler (function)
  //-------------------------------------------------------

  describe('setHandler (action, fn)', () => {
    it('registers a handler and invokes it', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('greet', (name) => `hello ${name}`);
      expect(a.invoke.greet('world')).toBe('hello world');
    });

    it('passes all arguments to the handler', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('add', (x, y) => x + y);
      expect(a.invoke.add(2, 3)).toBe(5);
    });

    it('overrides a previous handler', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('greet', () => 'first');
      a.setHandler('greet', () => 'second');
      expect(a.invoke.greet('x')).toBe('second');
    });

    it('returns this for chaining', () => {
      const a = new ActionExecuter<TestActions>();
      const result = a.setHandler('noop', () => {});
      expect(result).toBe(a);
    });
  });

  //-------------------------------------------------------
  //-- setHandler (object)
  //-------------------------------------------------------

  describe('setHandler (object)', () => {
    it('uses the object as execution target', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler({ greet: (name) => `hi ${name}`, add: (x, y) => x + y, noop: () => {} });
      expect(a.invoke.greet('yair')).toBe('hi yair');
      expect(a.invoke.add(1, 2)).toBe(3);
    });

    it('binds methods to the target so this is correct', () => {
      class SVC {
        tag = 'SVC';
        greet(name: string) {
          return `${this.tag} ${name}`;
        }
        add(a: number, b: number) {
          return a + b;
        }
        noop() {}
      }
      const a = new ActionExecuter<TestActions>();
      a.setHandler(new SVC());
      expect(a.invoke.greet('yair')).toBe('SVC yair');
    });

    it('replaces a previous execution target', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler({ greet: () => 'first', add: (x, y) => x + y, noop: () => {} });
      a.setHandler({ greet: () => 'second', add: (x, y) => x + y, noop: () => {} });
      expect(a.invoke.greet('x')).toBe('second');
    });

    it('returns this for chaining', () => {
      const a = new ActionExecuter<TestActions>();
      const result = a.setHandler({ greet: () => '', add: () => 0, noop: () => {} });
      expect(result).toBe(a);
    });
  });

  //-------------------------------------------------------
  //-- override priority: mapping > executionTarget
  //-------------------------------------------------------

  describe('handler priority', () => {
    it('individual handler overrides execution target for that action', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler({ greet: () => 'from target', add: (x, y) => x + y, noop: () => {} });
      a.setHandler('greet', () => 'from override');
      expect(a.invoke.greet('x')).toBe('from override');
    });

    it('non-overridden actions still fall through to execution target', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler({ greet: () => 'from target', add: (x, y) => x + y, noop: () => {} });
      a.setHandler('greet', () => 'from override');
      expect(a.invoke.add(1, 2)).toBe(3);
    });
  });

  //-------------------------------------------------------
  //-- setHandler ('*') catch-all
  //-------------------------------------------------------

  describe("setHandler ('*', fn)", () => {
    type OptionalActions = {
      greet(name: string): string;
      add(a: number, b: number): number;
      noop(): void;
      maybe?(x: string): string;
    };

    it('fires when no specific handler or execution target exists', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('*', () => 'catch-all');
      expect(a.invoke.greet('x')).toBe('catch-all');
    });

    it('receives action name as first argument', () => {
      const a = new ActionExecuter<TestActions>();
      const received: string[] = [];
      a.setHandler('*', (action) => {
        received.push(action);
      });
      a.invoke.greet('x');
      a.invoke.noop();
      expect(received).toEqual(['greet', 'noop']);
    });

    it('receives original call arguments after action name', () => {
      const a = new ActionExecuter<TestActions>();
      let capturedArgs: unknown[] = [];
      a.setHandler('*', (_action, ...args) => {
        capturedArgs = args;
      });
      a.invoke.add(7, 3);
      expect(capturedArgs).toEqual([7, 3]);
    });

    it('return value propagates back to caller', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('*', (action, ...args) => `${action}:${args.join(',')}`);
      expect(a.invoke.greet('yair')).toBe('greet:yair');
      expect(a.invoke.add(1, 2)).toBe('add:1,2');
    });

    it('specific handler takes priority over catch-all', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('*', () => 'catch-all');
      a.setHandler('greet', () => 'specific');
      expect(a.invoke.greet('x')).toBe('specific');
      expect(a.invoke.noop()).toBe('catch-all');
    });

    it('execution target takes priority over catch-all', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('*', () => 'catch-all');
      a.setHandler({ greet: () => 'from target', add: (x, y) => x + y, noop: () => {} });
      expect(a.invoke.greet('x')).toBe('from target');
    });

    it('catch-all fires for actions missing from execution target', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('*', () => 'fallback');
      a.setHandler({ add: (x, y) => x + y } as TestActions);
      expect(a.invoke.greet('x')).toBe('fallback');
      expect(a.invoke.add(1, 2)).toBe(3);
    });

    it('replaces a previous catch-all handler', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('*', () => 'first');
      a.setHandler('*', () => 'second');
      expect(a.invoke.greet('x')).toBe('second');
    });

    it('works with optional actions', () => {
      const a = new ActionExecuter<OptionalActions>();
      a.setHandler('*', (action) => `handled:${action}`);
      expect(a.invoke.maybe?.('x')).toBe('handled:maybe');
    });

    it('returns this for chaining', () => {
      const a = new ActionExecuter<TestActions>();
      const result = a.setHandler('*', () => {});
      expect(result).toBe(a);
    });
  });

  //-------------------------------------------------------
  //-- throws when not implemented
  //-------------------------------------------------------

  describe('missing handler', () => {
    it('throws when action has no handler and no execution target', () => {
      const a = new ActionExecuter<TestActions>();
      expect(() => a.invoke.greet('x')).toThrow('Action [greet] was not implemented');
    });

    it('throws when execution target does not have the action', () => {
      const a = new ActionExecuter<TestActions>();
      // partial target via cast — simulates missing method at runtime
      a.setHandler({ add: (x, y) => x + y } as TestActions);
      expect(() => a.invoke.greet('x')).toThrow('Action [greet] was not implemented');
    });

    it('throws with null', () => {
      const a = new ActionExecuter<TestActions>();
      expect(() => a.setHandler(null as unknown as TestActions)).toThrow();
    });
  });

  //-------------------------------------------------------
  //-- client
  //-------------------------------------------------------

  describe('client', () => {
    it('client that invokes registered handlers', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('add', (x, y) => x + y);
      const client = a.client;
      expect(client.invoke.add(3, 4)).toBe(7);
    });

    it('client reflects handlers registered with client', () => {
      const a = new ActionExecuter<TestActions>();
      const client = a.client;
      a.setHandler('greet', (name) => `hello ${name}`);
      expect(client.invoke.greet('late')).toBe('hello late');
    });

    it('multiple clients share the same handler state', () => {
      const a = new ActionExecuter<TestActions>();
      const c1 = a.client;
      const c2 = a.client;
      a.setHandler('noop', vi.fn());
      expect(() => {
        c1.invoke.noop();
      }).not.toThrow();
      expect(() => {
        c2.invoke.noop();
      }).not.toThrow();
    });
  });

  //-------------------------------------------------------
  //-- invoke (same proxy, assigned in constructor)
  //-------------------------------------------------------

  describe('invoke', () => {
    it('invoke reflects handlers registered after construction', () => {
      const a = new ActionExecuter<TestActions>();
      a.setHandler('add', (x, y) => x + y);
      expect(a.invoke.add(10, 5)).toBe(15);
    });
  });

  //-------------------------------------------------------
  //-- async actions
  //-------------------------------------------------------

  describe('async actions', () => {
    it('returns a promise and resolves the value', async () => {
      const a = new ActionExecuter<AsyncActions>();
      a.setHandler('fetchUser', (id) => Promise.resolve({ id, name: 'bob' }));
      const user = await a.invoke.fetchUser(1);
      expect(user).toEqual({ id: 1, name: 'bob' });
    });

    it('works with execution target async methods', async () => {
      class SVC {
        async fetchUser(id: number) {
          await Promise.resolve();
          return { id, name: 'from svc' };
        }
        async delay(ms: number) {
          await new Promise((r) => setTimeout(r, ms));
        }
      }
      const a = new ActionExecuter<AsyncActions>();
      a.setHandler(new SVC());
      const user = await a.invoke.fetchUser(42);
      expect(user).toEqual({ id: 42, name: 'from svc' });
    });

    it('individual override takes priority over async execution target', async () => {
      const a = new ActionExecuter<AsyncActions>();
      a.setHandler({
        fetchUser: (id) => Promise.resolve({ id, name: 'from target' }),
        delay: () => Promise.resolve(),
      });
      a.setHandler('fetchUser', (id) => Promise.resolve({ id, name: 'from override' }));
      const user = await a.invoke.fetchUser(1);
      expect(user).toEqual({ id: 1, name: 'from override' });
    });

    it('rejected promise propagates to the caller', async () => {
      const a = new ActionExecuter<AsyncActions>();
      a.setHandler('fetchUser', () => Promise.reject(new Error('network error')));
      await expect(a.invoke.fetchUser(1)).rejects.toThrow('network error');
    });
  });
});

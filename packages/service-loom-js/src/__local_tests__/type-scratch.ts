/* eslint-disable */
/**
 * Pure type-level scratch tests. Not meant to run — only compiled.
 * A TypeScript error in this file = a type contract violation.
 *
 * Conventions:
 *   const _: ExpectedType = value   → value must be assignable to ExpectedType
 *   type _check = AssertEq<A, B>    → A and B must be exactly equal
 *   // @ts-expect-error              → the next line MUST be a type error
 */

import type { EventClient } from '../events/eventClient.js';
import { EventEmitter } from '../events/eventEmitter.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
import type { ReactiveStateClient } from '../reactiveState/reactiveStateClient.js';
import { ActionExecuter } from '../actions/actionExecuter.js';
import type { ActionClient } from '../actions/actionClient.js';
import { Service } from '../services/service.js';
import type { ServiceDescriptor } from '../services/types.js';
import { createModule } from '../modules/moduleFactory.js';
import type {
  ActionsOf,
  StateOf,
  EventsOf,
  ActionsOfWithFallback,
  StateOfWithFallback,
  EventsOfWithFallback,
} from '../services/internal/types.js';
import type { Empty } from '../core/types.js';

// ---------------------------------------------------------------------------
// Type equality helper
// ---------------------------------------------------------------------------
type Equal<A, B> = [A] extends [B] ? [B] extends [A] ? true : false : false;
type AssertEq<T extends true> = T;

// ============================================================================
// 1. Standalone EventEmitter
// ============================================================================

type AppEvents = {
  connected: (ip: string) => void;
  disconnected: () => void;
};

{
  const emitter = new EventEmitter<AppEvents>();

  // .client is EventClient
  const evClient: EventClient<AppEvents> = emitter.client;

  // listener args are typed
  evClient.on('connected', (ip) => {
    const _: string = ip;
  });

  // EventEmitter itself can emit
  emitter.emit('connected', '127.0.0.1');
  emitter.emit('disconnected');

  // @ts-expect-error — wrong arg type
  emitter.emit('connected', 42);

  // @ts-expect-error — unknown event
  emitter.emit('unknown');

  // @ts-expect-error — EventClient cannot emit
  evClient.emit('connected', '127.0.0.1');
}

// ============================================================================
// 2. Standalone ActionExecuter
// ============================================================================

type AppActions = {
  greet(name: string): string;
  add(a: number, b: number): number;
};

{
  const actions = new ActionExecuter<AppActions>();
  actions.setHandler('greet', (name) => `hi ${name}`);

  // invoke is correctly typed
  const greeting: string = actions.invoke.greet('Alice');
  const sum: number = actions.invoke.add(1, 2);

  // invoke IS ActionClient<AppActions>
  const invoker: ActionClient<AppActions> = actions.invoke;

  // ActionExecuter no longer has .client — only .invoke
  // @ts-expect-error
  void actions.client;

  // @ts-expect-error — wrong arg count
  actions.invoke.greet('a', 'b');

  // @ts-expect-error — wrong return type
  const _n: number = actions.invoke.greet('x');
}

// ============================================================================
// 3. Standalone ReactiveState
// ============================================================================

type AppState = { count: number; name: string };

{
  const state = new ReactiveState<AppState>({ count: 0, name: 'Alice' });

  // get() returns S
  const s: AppState = state.get();
  const _count: number = s.count;

  // client is ReactiveStateClient
  const sc: ReactiveStateClient<AppState> = state.client;
  const s2: AppState = sc.get();

  // subscribe receives (next, prev?)
  state.subscribe((next, prev) => {
    const _n: AppState = next;
    const _p: AppState | undefined = prev;
  });

  // @ts-expect-error — client cannot update
  sc.update({ count: 1 });

  // @ts-expect-error — client cannot set
  sc.set({ count: 0, name: 'Bob' });
}

// ============================================================================
// 4. Service — full shape (state + events + actions)
// ============================================================================

type IFull = ServiceDescriptor<{
  state: { count: number };
  events: { changed: () => void };
  actions: {
    increment(): void;
    add(n: number): number;
  };
}>;

class FullService extends Service<IFull> implements IFull {
  constructor() {
    super('full', { count: 0 });
  }
  increment() {
    this.state.update((s) => { s.count += 1; });
    this.events.emit('changed');
  }
  add(n: number) {
    this.state.update((s) => { s.count += n; });
    return this.state.get().count;
  }
}

{
  const svc = new FullService();

  // this.actions is ActionExecuter<A>
  svc.actions.setHandler('increment', () => {});
  const _invoker: ActionClient<{ increment(): void; add(n: number): number }> = svc.actions.invoke;

  // this.invoke is the action invoker shorthand
  const _void: void = svc.invoke.increment();
  const _n: number = svc.invoke.add(5);

  // this.state is ReactiveState<S>
  const _count: number = svc.state.get().count;

  // this.events is EventEmitter<E>
  svc.events.on('changed', () => {});
  svc.events.emit('changed');

  // -- client --

  // client.actions is Invoker<A> — flat call, no setHandler
  const _cv: void = svc.client.actions.increment();
  const _cn: number = svc.client.actions.add(3);

  // @ts-expect-error — no setHandler on action client
  svc.client.actions.setHandler('increment', () => {});

  // client.state is ReactiveStateClient<S>
  const _cs: { count: number } = svc.client.state.get();

  // @ts-expect-error — no update on state client
  svc.client.state.update({ count: 1 });

  // client.events is EventClient<E>
  svc.client.events.on('changed', () => {});

  // @ts-expect-error — cannot emit through event client
  svc.client.events.emit('changed');
}

// ============================================================================
// 5. Service — no state
// ============================================================================

type INoState = ServiceDescriptor<{
  events: { tick: () => void };
  actions: { ping(): string };
}>;

class NoStateService extends Service<INoState> implements INoState {
  constructor() {
    super('no-state'); // no initial state arg
  }
  ping() { return 'pong'; }
}

{
  const svc = new NoStateService();

  // state.get() is undefined
  const _s: undefined = svc.state.get();
  const _sc: undefined = svc.client.state.get();

  // actions still work
  const _p: string = svc.invoke.ping();
}

// ============================================================================
// 6. Service — no actions
// ============================================================================

type INoActions = ServiceDescriptor<{
  state: { value: number };
  events: { changed: () => void };
}>;

class NoActionsService extends Service<INoActions> {
  constructor() {
    super('no-actions', { value: 0 });
  }
}

{
  const svc = new NoActionsService();

  // invoke is Invoker<Empty> = {} — no action methods
  const _inv: Invoker<Empty> = svc.invoke;

  // @ts-expect-error — no action named 'anything'
  svc.invoke.anything();

  // state and events still work normally
  const _v: number = svc.state.get().value;
  svc.events.on('changed', () => {});
}

// local helper for the check above
type Invoker<T> = { [K in keyof T]: T[K] };

// ============================================================================
// 7. Service — no events
// ============================================================================

type INoEvents = ServiceDescriptor<{
  state: { value: number };
  actions: { set(v: number): void };
}>;

class NoEventsService extends Service<INoEvents> implements INoEvents {
  constructor() {
    super('no-events', { value: 0 });
  }
  set(v: number) {
    this.state.update((s) => { s.value = v; });
  }
}

{
  const svc = new NoEventsService();

  // @ts-expect-error — 'changed' is not a defined event
  svc.events.emit('changed');

  // @ts-expect-error — same through client
  svc.client.events.on('changed', () => {});

  // actions still work
  svc.invoke.set(42);
}

// ============================================================================
// 8. Service<any> — must not break (IsAny guard)
// ============================================================================

{
  // A concrete service is assignable to Service<any>
  const anyService: Service<any> = new FullService();

  // All providers resolve to `any`
  const _a: ActionExecuter<any> = anyService.actions;
  const _i: any = anyService.invoke;
  const _s: ReactiveState<any> = anyService.state;
  const _e: EventEmitter<any> = anyService.events;
}

// ============================================================================
// 9. Module — explicit descriptor
// ============================================================================

type App = { counter: Service<IFull> };

{
  const app = createModule<App>({ counter: new FullService() });

  // service clients are correctly typed
  const _inc: void = app.services.counter.actions.increment();
  const _add: number = app.services.counter.actions.add(5);
  const _count: { count: number } = app.services.counter.state.get();
  app.services.counter.events.on('changed', () => {});

  // @ts-expect-error — cannot emit through service client
  app.services.counter.events.emit('changed');

  // @ts-expect-error — no setHandler through service client
  app.services.counter.actions.setHandler('increment', () => {});

  // module has start/stop but no state/events
  app.start();
  app.stop();
  // @ts-expect-error — no module.state
  app.state;
  // @ts-expect-error — no module.events
  app.events;
}

// ============================================================================
// 10. Module — inferred descriptor
// ============================================================================

{
  const app = createModule({ counter: new FullService() });

  // same typed surface, just inferred
  const _inc: void = app.services.counter.actions.increment();
  const _count: { count: number } = app.services.counter.state.get();
  app.services.counter.events.on('changed', () => {});
}

// ============================================================================
// 11. Type extractors — ActionsOf / StateOf / EventsOf
// ============================================================================

// Present fields — extract correctly
type _a  = AssertEq<Equal<ActionsOf<IFull>,    { increment(): void; add(n: number): number }>>;
type _s  = AssertEq<Equal<StateOf<IFull>,      { count: number }>>;
type _e  = AssertEq<Equal<EventsOf<IFull>,     { changed: () => void }>>;

// Absent fields — undefined
type _na = AssertEq<Equal<ActionsOf<INoActions>, undefined>>;
type _ns = AssertEq<Equal<StateOf<INoState>,     undefined>>;
type _ne = AssertEq<Equal<EventsOf<INoEvents>,   undefined>>;

// ============================================================================
// 12. WithFallback extractors
// ============================================================================

// Present fields — same result as non-fallback
type _af  = AssertEq<Equal<ActionsOfWithFallback<IFull>,  { increment(): void; add(n: number): number }>>;
type _sf  = AssertEq<Equal<StateOfWithFallback<IFull>,    { count: number }>>;
type _ef  = AssertEq<Equal<EventsOfWithFallback<IFull>,   { changed: () => void }>>;

// Absent actions/events → Empty (not undefined)
type _naf = AssertEq<Equal<ActionsOfWithFallback<INoActions>, Empty>>;
type _nef = AssertEq<Equal<EventsOfWithFallback<INoEvents>,   Empty>>;

// Absent state → still undefined (no Empty fallback for state)
type _nsf = AssertEq<Equal<StateOfWithFallback<INoState>, undefined>>;

// Service<any> → all resolve to any
type _aany = AssertEq<Equal<ActionsOfWithFallback<any>, any>>;
type _sany = AssertEq<Equal<StateOfWithFallback<any>,   any>>;
type _eany = AssertEq<Equal<EventsOfWithFallback<any>,  any>>;

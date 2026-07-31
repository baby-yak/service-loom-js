import { enableMapSet, produce, type Draft } from 'immer';
import type { StateProvider } from '../../core/internal/providerTypes.js';
import { _BRAND_REACTIVE_STATE_ } from '../../core/internal/symbols.js';
import type { UnsubscribeFn } from '../../core/types.js';
import type { StateMap } from '../index.js';
import {
  type StateListener,
  type StateListenersErrorHandlingType,
  type StateSelectFn,
} from '../types.js';
import { isPlainObject } from './../../utils/utils.js';
import { StateClient_imp } from './internal/stateClient_imp.js';
import type { ReactiveStateClient } from './reactiveStateClient.js';
import type { ReactiveStateSource } from './reactiveStateSource.js';

//-------------------------------------------------------
// -- enables immer Map/Set support globally — see README
enableMapSet();

/** Options passed to the {@link ReactiveState} constructor. */
export type ReactiveStateParams = {
  /** how to handle when a listener throws an error — default is `"warn"` */
  listenersErrorHandling?: StateListenersErrorHandlingType;
};

//-------------------------------------------------------
//-- types

const INITIAL = Symbol();

type ListenerContainer<S, U = S> = {
  listener: StateListener<U>;
  prev: typeof INITIAL | U;
  select: StateSelectFn<S, U> | undefined;
};

const DEFAULT_OPTIONS: Required<ReactiveStateParams> = {
  listenersErrorHandling: 'warn',
};

/**
 * Reactive state container backed by [immer](https://immerjs.github.io/immer/).
 *
 * The default choice. Use `update(draft => { ... })` to mutate state deeply
 * without writing spread boilerplate — immer handles structural sharing under
 * the hood. `update({ field })` is available as a shorthand shallow merge.
 *
 * Use `updatePure()` for explicit immutable updates without immer recipes.
 *
 * @example
 * ```ts
 * const state = new ReactiveState({ count: 0 });
 * state.update(draft => { draft.count++; });
 * ```
 */
export class ReactiveState<S extends StateMap>
  implements ReactiveStateSource<S>, StateProvider<ReactiveStateClient<S>>
{
  readonly [_BRAND_REACTIVE_STATE_] = true;

  private _initial: S;
  private _state: S;
  private _listeners: ListenerContainer<S, any>[];
  private _options: Required<ReactiveStateParams>;

  /**
   * Returns a {@link StateClient} facade that exposes only the read-only interface.
   * Safe to hand to consumers that should not be able to mutate state.
   */
  readonly client: ReactiveStateClient<S>;

  constructor(initial: S, options?: ReactiveStateParams) {
    this._initial = initial;
    this._state = initial;
    this._listeners = [];
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.client = new StateClient_imp(this);
  }

  /** Replaces the state. No-ops if the new value is the same reference (`Object.is`). */
  set(state: S): void {
    const prev = this._state;
    if (Object.is(prev, state)) return;

    this._state = state;
    const listeners = [...this._listeners];
    for (const container of listeners) {
      this._notifyListener(state, container);
    }
  }

  //-------------------------------------------------------
  //-- implement ReactiveStateSource<S>
  //-------------------------------------------------------

  get<U = S>(select?: StateSelectFn<S, U>) {
    if (select) {
      return select(this._state);
    } else {
      return this._state as unknown as U;
    }
  }

  getInitialState<U = S>(select?: StateSelectFn<S, U>) {
    if (select) {
      return select(this._initial);
    } else {
      return this._initial as unknown as U;
    }
  }

  subscribe(listener: StateListener<S>): UnsubscribeFn;
  subscribe<U>(select: StateSelectFn<S, U>, listener: StateListener<U>): UnsubscribeFn;
  subscribe(a: unknown, b?: unknown): UnsubscribeFn {
    if (b) {
      const select = a as StateSelectFn<S, any>;
      const listener = b as StateListener<any>;
      return this._subscribe(select, listener);
    } else {
      const select = undefined;
      const listener = a as StateListener<any>;
      return this._subscribe(select, listener);
    }
  }

  _subscribe<U = S>(select: StateSelectFn<S, U> | undefined, listener: StateListener<U>) {
    const container: ListenerContainer<S, any> = {
      prev: INITIAL,
      select,
      listener,
    };
    this._listeners.push(container);

    //first fire on subscribe:
    this._notifyListener(this.get(), container);

    return () => {
      this._listeners = this._listeners.filter((x) => x !== container);
    };
  }

  select<U>(selector: StateSelectFn<S, U>) {
    return new StateClient_imp(this, selector);
  }

  /**
   * Updates the state in one of two ways:
   * - **Partial object** — shallow-merges into the current state (plain objects only; others are replaced wholesale).
   * - **Immer recipe** — receives a mutable draft; mutate it directly. Return values are intentionally
   *   ignored so patterns like `s.arr.push(x)` work without immer throwing on the non-void return.
   *   Not supported for primitive state — use {@link set} instead.
   *
   * > **Note:** recipe functions must mutate the draft — returning a new state object has no effect.
   * > For full state replacement via a pure function use {@link updatePure};
   * > for direct replacement use {@link set}.
   */
  update(recipe: Partial<S> | ((draft: Draft<S>) => void)): void {
    const prev = this._state;
    let next: S;
    if (typeof recipe === 'function') {
      if (typeof prev !== 'object' || prev === null) {
        throw new Error(
          'update() with a recipe is not supported for primitive state. Use set() instead.',
        );
      }
      next = produce<S>(prev, (update) => {
        // Wraps recipe to discard return values — immer would otherwise
        // throw on common patterns like s.arr.push(x) that return non-void.
        // For full state replacement, use set() or updatePure()
        recipe(update);
      });
    } else {
      next = isPlainObject(prev) ? { ...prev, ...recipe } : (recipe as S);
    }
    this.set(next);
  }

  /**
   * Updates the state in one of two ways:
   * - **Partial object** — shallow-merges into the current state (plain objects only; others are replaced wholesale).
   * - **Pure reducer** — receives the current (deeply readonly) state and must return the new state.
   */
  updatePure(state: Partial<S> | ((state: S) => S)): void {
    const prev = this._state;
    const next: S =
      typeof state === 'function'
        ? state(prev)
        : isPlainObject(prev)
          ? { ...prev, ...state }
          : (state as S);
    this.set(next);
  }
  //-------------------------------------------------------
  //-- helpers
  //-------------------------------------------------------
  private _notifyListener(state: S, container: ListenerContainer<S, any>) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const selected = container.select ? container.select(state) : state;

      if (container.prev !== INITIAL && Object.is(container.prev, selected)) {
        return;
      }

      container.listener(selected, container.prev === INITIAL ? undefined : container.prev);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      container.prev = selected;
    } catch (error) {
      this._handleListenerException(error);
    }
  }

  private _handleListenerException(err: unknown) {
    const handling = this._options.listenersErrorHandling;

    if (handling === 'throw') {
      throw err;
    }

    if (typeof handling === 'function') {
      handling(err);
      return;
    }

    const msg = `[${this.constructor.name}] listener error`;

    switch (handling) {
      case 'ignore':
        break;
      case 'log':
        console.log(msg, err);
        break;
      case 'warn':
        console.warn(msg, err);
        break;
      case 'error':
        console.error(msg, err);
        break;
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = handling;
        break;
      }
    }
  }
}

import { enableMapSet, produce, type Draft } from "immer";
import type { UnsubscribeFn } from "../core/types.js";
import type { RawStateProvider } from "../state/index.js";
import { StateClient_imp } from "./internal/stateClient_imp.js";
import { StateSelector_imp } from "./internal/stateSelector_imp.js";
import { isPlainObject } from "./internal/utils.js";
import type { ReactiveStateClient } from "./reactiveStateClient.js";
import {
  type StateListener,
  type StateListenersErrorHandlingType,
  type StateSelectFn,
} from "./types.js";

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

type ListenerContainer<S> = {
  listener: StateListener<S>;
};

const DEFAULT_OPTIONS: Required<ReactiveStateParams> = {
  listenersErrorHandling: "warn",
};

/** guard against a listener that keeps setting the state - a logic loop */
const MAX_SET_DEPTH = 1_000;

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
export class ReactiveState<S> implements RawStateProvider<S> {
  //instance marker

  private _initial: S;
  private _state: S;
  private _listeners: ListenerContainer<S>[];
  private _options: Required<ReactiveStateParams>;

  private _set_depth = 0;
  private _set_running = false;
  private _set_postOperations: {
    kind: "set" | "update";
    run: () => void;
  }[] = [];

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

  get<U = S>(select?: StateSelectFn<S, U>): U {
    if (select) {
      return select(this._state);
    } else {
      return this._state as unknown as U;
    }
  }

  getInitialState<U = S>(select?: StateSelectFn<S, U>): U {
    if (select) {
      return select(this._initial);
    } else {
      return this._initial as unknown as U;
    }
  }

  /** Replaces the state. No-ops if the new value is the same reference (`Object.is`). */
  set(state: S): void {
    // a set/update from inside a listener is stacked and run once the
    // current notification pass is done - so listeners never see a stale state.
    if (this._set_running) {
      this._set_postOperations.push({
        kind: "set",
        run: () => this.set(state),
      });
      return;
    }

    // nothing to notify and nothing to stack - bail out before taking the lock
    if (Object.is(this._state, state)) return;

    this._set_running = true;
    this._set_depth++;

    try {
      if (this._set_depth > MAX_SET_DEPTH) {
        throw new Error(
          `set state overflow... (called ${this._set_depth} time) do you have a logic loop?`,
        );
      }

      const prev = this._state;
      this._state = state;

      // listeners are wrapped by subscribe() - they already apply
      // the configured listenersErrorHandling, so no try/catch here.
      const listeners = [...this._listeners];
      for (const container of listeners) {
        container.listener(state, prev);
      }

      // release the lock before draining, so the stacked work
      // sees the settled state and can stack its own follow-ups.
      this._set_running = false;

      //left overs from locked set?
      const postOps = this._set_postOperations.splice(0);
      for (const job of postOps) {
        job.run();
      }
    } finally {
      // must always release - an early return or a throw here would
      // otherwise wedge the instance and silently swallow every later set.
      this._set_running = false;
      this._set_depth--;
      if (this._set_depth === 0) {
        this._set_postOperations.length = 0;
      }
    }
  }

  subscribe(listener: StateListener<S>): UnsubscribeFn {
    const safeListener: StateListener<S> = (state, prev) => {
      try {
        listener(state, prev);
      } catch (error) {
        this._handleListenerException(error);
      }
    };
    const container: ListenerContainer<S> = {
      listener: safeListener,
    };
    this._listeners.push(container);

    safeListener(this.get(), undefined);

    return () => {
      this._listeners = this._listeners.filter((x) => x !== container);
    };
  }

  select<U>(selector: StateSelectFn<S, U>): ReactiveStateClient<U> {
    return new StateSelector_imp(this, selector);
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
    if (this._set_running) {
      this._set_postOperations.push({
        kind: "update",
        run: () => this.update(recipe),
      });
      return;
    }

    const prev = this._state;
    let next: S;
    if (typeof recipe === "function") {
      if (typeof prev !== "object" || prev === null) {
        throw new Error(
          "update() with a recipe is not supported for primitive state. Use set() instead.",
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
    if (this._set_running) {
      this._set_postOperations.push({
        kind: "update",
        run: () => this.updatePure(state),
      });
      return;
    }

    const prev = this._state;
    const next: S =
      typeof state === "function"
        ? state(prev)
        : isPlainObject(prev)
          ? { ...prev, ...state }
          : (state as S);
    this.set(next);
  }
  //-------------------------------------------------------
  //-- helpers
  //-------------------------------------------------------

  private _handleListenerException(err: unknown) {
    const handling = this._options.listenersErrorHandling;

    if (handling === "throw") {
      throw err;
    }

    if (typeof handling === "function") {
      handling(err);
      return;
    }

    const msg = `[${this.constructor.name}] listener error`;

    switch (handling) {
      case "ignore":
        break;
      case "log":
        console.log(msg, err);
        break;
      case "warn":
        console.warn(msg, err);
        break;
      case "error":
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

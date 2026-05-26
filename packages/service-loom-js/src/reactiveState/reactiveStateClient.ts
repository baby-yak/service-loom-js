import type { UnsubscribeFn } from '../core/types.js';
import type { RawStateClient } from '../state/rawStateClient.js';
import type { StateListener, StateSelectFn } from './types.js';

/** Read-only view of a reactive state container. */
export interface ReactiveStateClient<S> extends RawStateClient<S> {
  /** Returns the current state (deeply readonly). */
  get<U = S>(select?: StateSelectFn<S, U>): U;

  /** Returns the initial state (deeply readonly). */
  getInitialState<U = S>(select?: StateSelectFn<S, U>): U;

  /**
   * Subscribes to state changes. The listener is called immediately with the
   * current state (`prev` will be `undefined` on that first call), then again
   * on every subsequent change.
   * @returns An {@link UnsubscribeFn} that removes the listener when called.
   */
  subscribe(listener: StateListener<S>): UnsubscribeFn;

  /**
   * Creates a derived {@link StateClient} that emits only when the selected
   * value changes (compared with `Object.is`). Chained selectors are flattened
   * into a single selector for efficiency.
   */
  select<U>(selector: StateSelectFn<S, U>): ReactiveStateClient<U>;
}

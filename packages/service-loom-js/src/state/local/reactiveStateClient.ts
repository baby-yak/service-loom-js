import { _BRAND_REACTIVE_STATE_CLIENT_ } from '../../core/internal/symbols.js';
import type { UnsubscribeFn } from '../../core/types.js';
import type { StateMap } from '../types.js';
import type { ReactiveStateSource } from './reactiveStateSource.js';
import type { StateListener, StateSelectFn } from './types.js';

/** Read-only view of a reactive state container. */
export abstract class ReactiveStateClient<S extends StateMap> implements ReactiveStateSource<S> {
  readonly [_BRAND_REACTIVE_STATE_CLIENT_] = true;

  abstract get<U = S>(select?: StateSelectFn<S, U>): U;
  abstract getInitialState<U = S>(select?: StateSelectFn<S, U>): U;
  abstract subscribe(listener: StateListener<S>): UnsubscribeFn;
  abstract select<U>(selector: StateSelectFn<S, U>): ReactiveStateClient<U>;
}

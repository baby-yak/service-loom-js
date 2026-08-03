import { _REMOTE_STATE_CLIENT_, _BRANDS_ } from '../../core/internal/symbols.js';
import type { UnsubscribeFn } from '../../core/types.js';
import type { StateListener, StateMap, StateSelectFn } from '../types.js';
import type { RemoteStateSource } from './remoteStateSource.js';

/** Read-only view of a reactive state container. */
export abstract class RemoteStateClient<S extends StateMap> implements RemoteStateSource<S> {
  readonly [_BRANDS_] = [_REMOTE_STATE_CLIENT_];

  abstract get<U = S>(select?: StateSelectFn<S, U>): Promise<U>;
  abstract subscribe(listener: StateListener<S>): UnsubscribeFn;
  abstract select<U>(selector: StateSelectFn<S, U>): RemoteStateClient<U>;
}

import { _BRAND_REMOTE_STATE_CLIENT_ } from '../../core/internal/symbols.js';
import type { UnsubscribeFn } from '../../core/types.js';
import type { StateListener, StateMap, StateSelectFn } from '../types.js';
import type { RemoteStateSource } from './remoteStateSource.js';

/** Read-only view of a reactive state container. */
export abstract class RemoteStateClient<S extends StateMap> implements RemoteStateSource<S> {
  readonly [_BRAND_REMOTE_STATE_CLIENT_] = true;

  abstract get<U = S>(select?: StateSelectFn<S, U>): Promise<U>;
  abstract subscribe(listener: StateListener<S>): UnsubscribeFn;
  abstract select<U>(selector: StateSelectFn<S, U>): RemoteStateClient<U>;
}

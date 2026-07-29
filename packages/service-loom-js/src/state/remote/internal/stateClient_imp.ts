import type { StateListener, StateMap, StateSelectFn } from '../../types.js';
import type { RemoteState } from '../remoteState.js';
import { RemoteStateClient } from '../remoteStateClient.js';

export class StateClient_imp<S extends StateMap> extends RemoteStateClient<S> {
  private source: RemoteState<S>;

  constructor(source: RemoteState<S>) {
    super();
    this.source = source;
  }

  get<U = S>(select?: StateSelectFn<S, U>) {
    return this.source.get(select);
  }
  subscribe(listener: StateListener<S>) {
    return this.source.subscribe(listener);
  }
  select<U>(selector: StateSelectFn<S, U>) {
    return this.source.select(selector);
  }
}

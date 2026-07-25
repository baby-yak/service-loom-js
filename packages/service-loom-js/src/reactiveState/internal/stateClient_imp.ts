import type { StateMap } from '../../state/types.js';
import type { ReactiveState } from '../reactiveState.js';
import { ReactiveStateClient } from '../reactiveStateClient.js';
import type { StateListener, StateSelectFn } from '../types.js';

export class StateClient_imp<S extends StateMap> extends ReactiveStateClient<S> {
  private source: ReactiveState<S>;

  constructor(source: ReactiveState<S>) {
    super();
    this.source = source;
  }

  get<U = S>(select?: StateSelectFn<S, U>): U {
    return this.source.get(select);
  }
  getInitialState<U = S>(select?: StateSelectFn<S, U>): U {
    return this.source.getInitialState(select);
  }
  subscribe(listener: StateListener<S>) {
    return this.source.subscribe(listener);
  }
  select<U>(selector: StateSelectFn<S, U>) {
    return this.source.select(selector);
  }
}

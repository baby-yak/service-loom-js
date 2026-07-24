import { _BRAND_REACTIVE_STATE_CLIENT } from '../../core/internal/symbols.js';
import type { StateMap } from '../../state/types.js';
import type { ReactiveState } from '../reactiveState.js';
import type { ReactiveStateClient } from '../reactiveStateClient.js';
import type { StateListener, StateSelectFn } from '../types.js';

export class StateClient_imp<S extends StateMap> implements ReactiveStateClient<S> {
  readonly [_BRAND_REACTIVE_STATE_CLIENT] = true;

  private source: ReactiveState<S>;

  constructor(source: ReactiveState<S>) {
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

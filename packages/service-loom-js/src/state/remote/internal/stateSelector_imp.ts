import type { UnsubscribeFn } from '../../../core/types.js';
import type { StateListener, StateSelectFn } from '../../types.js';
import type { RemoteState } from '../remoteState.js';
import { RemoteStateClient } from '../remoteStateClient.js';

export class StateSelector_imp<S, U> extends RemoteStateClient<U> {
  private source: RemoteState<S>;
  private fn: StateSelectFn<S, U>;

  constructor(source: RemoteState<S>, fn: StateSelectFn<S, U>) {
    super();
    this.source = source;
    this.fn = fn;
  }

  get<W = U>(select?: StateSelectFn<U, W>) {
    if (select) {
      // chain stored and provided select functions S=>U=>W
      const chain = (state: S) => select(this.fn(state));
      return this.source.get(chain);
    } else {
      // cast
      const noChain = (state: S) => this.fn(state) as unknown as W;
      return this.source.get(noChain);
    }
  }

  subscribe(listener: StateListener<U>): UnsubscribeFn {
    const INITIAL = Symbol();
    let prev: U | typeof INITIAL = INITIAL;

    return this.source.subscribe((state) => {
      // no change on selected value - NOOP
      // (do run first time though)

      const selected = this.fn(state);

      if (prev !== INITIAL && Object.is(prev, selected)) {
        return;
      }

      listener(selected, prev === INITIAL ? undefined : prev);
      prev = selected;
    });
  }

  select<W>(selector: StateSelectFn<U, W>) {
    const fn: StateSelectFn<S, W> = (state) => {
      const sub = this.fn(state);
      return selector(sub);
    };
    return new StateSelector_imp(this.source, fn);
  }
}

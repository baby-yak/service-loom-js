import type { UnsubscribeFn } from '../../core/types.js';
import type { ReactiveStateClient } from '../reactiveStateClient.js';
import type { StateListener, StateSelectFn } from '../types.js';

export class StateSelector_imp<S, U> implements ReactiveStateClient<U> {
  private source: ReactiveStateClient<S>;
  private fn: StateSelectFn<S, U>;

  constructor(source: ReactiveStateClient<S>, fn: StateSelectFn<S, U>) {
    this.source = source;
    this.fn = fn;
  }

  get<W = U>(select?: StateSelectFn<U, W>): W {
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
  getInitialState<W = U>(select?: StateSelectFn<U, W>): W {
    if (select) {
      // chain stored and provided select functions S=>U=>W
      const chain = (state: S) => select(this.fn(state));
      return this.source.getInitialState(chain);
    } else {
      // cast
      const noChain = (state: S) => this.fn(state) as unknown as W;
      return this.source.getInitialState(noChain);
    }
  }
  subscribe(listener: StateListener<U>): UnsubscribeFn {
    let prev: U | undefined = undefined;

    return this.source.subscribe((state) => {
      // no change on selected value - NOOP
      // (do run first time though)

      const selected = this.fn(state);

      if (prev !== undefined && Object.is(prev, selected)) {
        return;
      }

      listener(selected, prev);
      prev = selected;
    });
  }
  select<W>(selector: StateSelectFn<U, W>): ReactiveStateClient<W> {
    const fn: StateSelectFn<S, W> = (state) => {
      const sub = this.fn(state);
      return selector(sub);
    };
    return new StateSelector_imp(this.source, fn);
  }
}

import type { UnsubscribeFn } from '../../../core/types.js';
import type { StateListener, StateMap, StateSelectFn } from '../../types.js';
import type { ReactiveState } from '../reactiveState.js';
import { ReactiveStateClient } from '../reactiveStateClient.js';

export class StateClient_imp<
  S extends StateMap,
  U extends StateMap = S,
> extends ReactiveStateClient<U> {
  private source: ReactiveState<S>;
  private fn: StateSelectFn<S, U> | undefined;

  constructor(source: ReactiveState<S>, select?: StateSelectFn<S, U>) {
    super();
    this.source = source;
    this.fn = select;
  }

  get<W = U>(select?: StateSelectFn<U, W>): W {
    const chain = this.makeChainSelect(select);
    return this.source.get(chain);
  }

  getInitialState<W = U>(select?: StateSelectFn<U, W>): W {
    const chain = this.makeChainSelect(select);
    return this.source.getInitialState(chain);
  }

  subscribe(listener: StateListener<U>): UnsubscribeFn;
  subscribe<W>(select: StateSelectFn<U, W>, listener: StateListener<W>): UnsubscribeFn;
  subscribe(a: unknown, b?: unknown): UnsubscribeFn {
    let select: StateSelectFn<U, any> | undefined;
    let listener: StateListener<any>;

    if (b) {
      select = a as StateSelectFn<U, any>;
      listener = b as StateListener<any>;
    } else {
      select = undefined;
      listener = a as StateListener<any>;
    }
    const chain = this.makeChainSelect(select);
    if (chain) {
      return this.source.subscribe(chain, listener);
    } else {
      return this.source.subscribe(listener);
    }
  }

  select<W>(select: StateSelectFn<U, W>) {
    const chain = this.makeChainSelect(select) ?? ((s) => s as any as W);
    return this.source.select(chain);
  }

  //-------------------------------------------------------

  private makeChainSelect<W = U>(select?: StateSelectFn<U, W>): StateSelectFn<S, W> | undefined {
    const selfSelect = this.fn;
    if (select) {
      if (selfSelect) {
        return (state: S) => select(selfSelect(state));
      } else {
        return select as any as StateSelectFn<S, W>;
      }
    } else {
      if (selfSelect) {
        return ((state: S) => selfSelect(state)) as any as StateSelectFn<S, W>;
      } else {
        return undefined;
      }
    }
  }
}

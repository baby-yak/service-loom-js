import type { StateProvider } from '../../core/internal/providerTypes.js';
import { _BRAND_REMOTE_STATE_ } from '../../core/internal/symbols.js';
import type { StateMap } from '../index.js';
import {
  type StateListener,
  type StateListenersErrorHandlingType,
  type StateSelectFn,
} from '../types.js';
import { StateClient_imp } from './internal/stateClient_imp.js';
import { StateSelector_imp } from './internal/stateSelector_imp.js';
import type { RemoteStateClient } from './remoteStateClient.js';
import type { RemoteStateSource } from './remoteStateSource.js';

/** Options passed to the {@link RemoteState} constructor. */
export type RemoteStateParams = {
  /** how to handle when a listener throws an error — default is `"warn"` */
  listenersErrorHandling?: StateListenersErrorHandlingType;
};

//-------------------------------------------------------
//-- types

type ListenerContainer<S> = {
  listener: StateListener<S>;
};

const DEFAULT_OPTIONS: Required<RemoteStateParams> = {
  listenersErrorHandling: 'warn',
};

/**
 * Reactive state container backed by [immer](https://immerjs.github.io/immer/).
 *
 * The default choice. Use `update(draft => { ... })` to mutate state deeply
 * without writing spread boilerplate — immer handles structural sharing under
 * the hood. `update({ field })` is available as a shorthand shallow merge.
 *
 * Use `updatePure()` for explicit immutable updates without immer recipes.
 *
 * @example
 * ```ts
 * const state = new ReactiveState({ count: 0 });
 * state.update(draft => { draft.count++; });
 * ```
 */
export class RemoteState<S extends StateMap>
  implements RemoteStateSource<S>, StateProvider<RemoteStateClient<S>>
{
  readonly [_BRAND_REMOTE_STATE_] = true;

  private _listeners: ListenerContainer<S>[];
  private _options: Required<RemoteStateParams>;

  /**
   * Returns a {@link StateClient} facade that exposes only the read-only interface.
   * Safe to hand to consumers that should not be able to mutate state.
   */
  readonly client: RemoteStateClient<S>;

  constructor(options?: RemoteStateParams) {
    this._listeners = [];
    this._options = {
      ...DEFAULT_OPTIONS,
      ...options,
    };

    this.client = new StateClient_imp(this);
  }

  //-------------------------------------------------------
  //-- implement ReactiveStateSource<S>
  //-------------------------------------------------------

  get<U = S>(select?: StateSelectFn<S, U>) {
    return Promise.reject(new Error('not implemented'));
    // if (select) {
    //   return Promise.resolve(select(this._state));
    // } else {
    //   return Promise.resolve(this._state as unknown as U);
    // }
  }

  subscribe(listener: StateListener<S>) {
    const safeListener: StateListener<S> = (state, prev) => {
      try {
        listener(state, prev);
      } catch (error) {
        this._handleListenerException(error);
      }
    };
    const container: ListenerContainer<S> = {
      listener: safeListener,
    };
    this._listeners.push(container);

    //initial value
    this.get()
      .then((s) => safeListener(s, undefined))
      .catch((err: unknown) => console.error(err));

    return () => {
      this._listeners = this._listeners.filter((x) => x !== container);
    };
  }

  select<U>(selector: StateSelectFn<S, U>) {
    return new StateSelector_imp(this, selector);
  }

  //-------------------------------------------------------
  //-- helpers
  //-------------------------------------------------------

  private _handleListenerException(err: unknown) {
    const handling = this._options.listenersErrorHandling;

    if (handling === 'throw') {
      throw err;
    }

    if (typeof handling === 'function') {
      handling(err);
      return;
    }

    const msg = `[${this.constructor.name}] listener error`;

    switch (handling) {
      case 'ignore':
        break;
      case 'log':
        console.log(msg, err);
        break;
      case 'warn':
        console.warn(msg, err);
        break;
      case 'error':
        console.error(msg, err);
        break;
      default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _: never = handling;
        break;
      }
    }
  }
}

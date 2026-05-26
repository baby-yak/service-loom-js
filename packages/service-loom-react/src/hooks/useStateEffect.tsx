import {
  isServiceClient,
  type ReactiveState,
  type ReactiveStateClient,
  type ServiceClient,
  type StateListener,
  type StateSelectFn,
} from '@baby-yak/service-loom-js';
import { useEffect, type DependencyList } from 'react';

//-------------------------------------------------------
// overload 1: whole state
//-------------------------------------------------------

/**
 * Runs a side effect whenever state changes — without causing a re-render.
 * The callback is also called once on mount with `prev = undefined`.
 *
 * @param target a `StateClient` or a `ServiceClient` with state
 * @param callback called with `(state, prev)` on every change; `prev` is `undefined` on the first call
 * @param deps controls when the subscription is re-created — include any values the callback closes over
 */
export function useStateEffect<S>(
  target:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  callback: StateListener<S>,
  deps?: DependencyList,
): void;

//-------------------------------------------------------
// overload 2: with select function
//-------------------------------------------------------

/**
 * Runs a side effect whenever a selected slice of state changes — without causing a re-render.
 * The callback is also called once on mount with `prev = undefined`.
 *
 * @param target a `StateClient` or a `ServiceClient` with state
 * @param selector extracts the slice of state to watch
 * @param callback called with `(selected, prev)` on every change; `prev` is `undefined` on the first call
 * @param deps controls when the subscription is re-created — include any values the callback closes over
 */
export function useStateEffect<S, U = S>(
  target:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  selector: StateSelectFn<S, U>,
  callback: StateListener<U>,
  deps?: DependencyList,
): void;

//-------------------------------------------------------
// overloads implementation (just routing to implementing function bellow)
//-------------------------------------------------------

export function useStateEffect<S, U = S>(
  a:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  b: StateListener<S> | StateSelectFn<S, U>,
  c?: DependencyList | StateListener<U>,
  d?: DependencyList,
) {
  // router function to match overloaded args
  const target = a;
  let selector: StateSelectFn<S, U> | undefined = undefined;
  let callback: StateListener<S> | StateListener<U> | undefined =
    undefined;
  let deps: DependencyList | undefined = undefined;

  if (c == null || Array.isArray(c)) {
    callback = b;
    deps = c;
  } else {
    selector = b as StateSelectFn<S, U>;
    callback = c as StateListener<U>;
    deps = d;
  }
  useStateEffect_imp(target, selector, callback, deps);
}

//-------------------------------------------------------
// implementation
//-------------------------------------------------------

function useStateEffect_imp<S, U = S>(
  target:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  selector: StateSelectFn<S, U> | undefined,
  callback: StateListener<any>,
  deps?: DependencyList,
) {
  useEffect(() => {
    let stateClient: ReactiveStateClient<S>;

    if (isServiceClient(target)) {
      stateClient = target.state;
    } else {
      stateClient = target;
    }

    if (selector) {
      return stateClient.select(selector).subscribe(callback);
    }
    return stateClient.subscribe(callback);
  }, deps ?? []);
}

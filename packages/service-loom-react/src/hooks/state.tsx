import {
  isServiceClient,
  type ReactiveState,
  type ReactiveStateClient,
  type ServiceClient,
  type StateSelectFn
} from '@baby-yak/service-loom-js';
import {
  type DependencyList,
  useCallback,
  useSyncExternalStore,
} from 'react';

//-------------------------------------------------------
// overload 1: whole state
//-------------------------------------------------------
/**
 * Hook for getting reactive state. rerender the component if the state changes
 *
 * @param target a service client with state or a reactive state client
 * @param deps optional DependencyList
 */
export function useReactiveState<S>(
  target:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  deps?: DependencyList,
): S;

//-------------------------------------------------------
// overload 2: with select function
//-------------------------------------------------------

/**
 * Hook for getting reactive state. rerender the component if the state changes
 *
 * @param target a service client with state or a reactive state client
 * @param selector a selector function to first select a portion of the state
 * @param deps optional DependencyList
 */
export function useReactiveState<S, U = S>(
  target:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  selector: StateSelectFn<S, U>,
  deps?: DependencyList,
): U;

//-------------------------------------------------------
// overloads implementation (just routing to implementing function bellow)
//-------------------------------------------------------

export function useReactiveState<S, U = S>(
  a:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  b?: StateSelectFn<S, U> | DependencyList,
  c?: DependencyList,
) {
  // router function to match overloaded args
  const target = a;
  let selector: StateSelectFn<S, U> | undefined = undefined;
  let deps: DependencyList | undefined = undefined;

  if (b != null && typeof b === 'function') {
    selector = b;
  }
  if (b != null && Array.isArray(b)) {
    deps = b;
  }
  if (c != null) {
    deps = c;
  }
  if (!deps) {
    deps = [];
  }
  return useReactiveState_imp(target, selector, deps);
}

//-------------------------------------------------------
// implementation
//-------------------------------------------------------

function useReactiveState_imp<S, U = S>(
  target:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  selector: StateSelectFn<S, U> | undefined,
  deps: DependencyList,
) {
  // subscribe function
  const subscribe = useCallback((onStoreChange: () => void) => {
    const client = getStateClient(target, selector);
    return client.subscribe(onStoreChange);
  }, deps);

  // get function
  const get = useCallback(() => {
    const client = getStateClient(target, selector);
    return client.get();
  }, deps);

  // get initial function
  const getInitialState = useCallback(() => {
    const client = getStateClient(target, selector);
    return client.getInitialState();
  }, deps);

  // the store:
  return useSyncExternalStore(subscribe, get, getInitialState);
}

//-------------------------------------------------------
//-- helpers
//-------------------------------------------------------

/**
 * extract the client from state or service with state
 * 1. get state state directly or from the service
 * 2. if selector function exists - return selected, otherwise - return as is
 */
function getStateClient<S, U = S>(
  target:
    | ReactiveStateClient<S>
    | ServiceClient<{ state: S }, ReactiveState<S>>,
  selector: StateSelectFn<S, U> | undefined,
): ReactiveStateClient<U | S> {
  let stateClient: ReactiveStateClient<S>;

  if (isServiceClient(target)) {
    stateClient = target.state;
  } else {
    stateClient = target;
  }

  if (selector) {
    return stateClient.select(selector);
  }
  return stateClient;
}

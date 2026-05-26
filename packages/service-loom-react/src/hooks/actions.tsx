import {
  type ActionClient,
  type ActionMap,
  type ActionNames,
  type ActionParams,
  type ActionReturnType,
  type ServiceClient,
} from '@baby-yak/service-loom-js';
import { useCallback, useRef, useState } from 'react';
import { extractActions } from '../utils.js';

/**
 * Returns a typed action function from a service or action client.
 * Equivalent to calling `services.myService.actions.someAction` directly —
 * just a typed convenience wrapper for uniform hook-style access.
 *
 * @param target an `ActionClient` or a `ServiceClient` with actions
 * @param action the action name to retrieve
 */
export function useAction<T_ActionMap extends ActionMap>(
  target:
    | ActionClient<T_ActionMap>
    | ServiceClient<{ actions: T_ActionMap }, any>,
  action: ActionNames<T_ActionMap>,
) {
  return extractActions(target).invoke[action];
}

//-------------------------------------------------------
//-- useActionAsync
//-------------------------------------------------------

/**
 * Tracks the async execution of a service action — loading, result, and error state.
 * Stale results are discarded when `execute` is called again before the previous call resolves.
 * Previous `data` is kept while loading and on error — only updated on success.
 *
 * @param target an `ActionClient` or a `ServiceClient` with actions
 * @param action the action name to execute
 */
export function useActionAsync<
  T_ActionMap extends ActionMap,
  T_Action extends ActionNames<T_ActionMap>,
>(
  target:
    | ActionClient<T_ActionMap>
    | ServiceClient<{ actions: T_ActionMap }, any>,
  action: T_Action,
): AsyncAction<
  ActionReturnType<T_ActionMap, T_Action>,
  ActionParams<T_ActionMap, T_Action>
>;

/**
 * Tracks the async execution of a raw function — loading, result, and error state.
 * Stale results are discarded when `execute` is called again before the previous call resolves.
 * Previous `data` is kept while loading and on error — only updated on success.
 *
 * @param fn the async (or sync) function to track
 */
export function useActionAsync<T_Res, T_Params extends any[]>(
  fn: (...args: T_Params) => T_Res,
): AsyncAction<T_Res, T_Params>;

// Implementation — routes to useActionAsync_imp
export function useActionAsync(
  targetOrFn:
    | ((...args: any[]) => any)
    | ActionClient<any>
    | ServiceClient<any, any>,
  action?: string,
): AsyncAction<any, any[]> {
  //get the function:
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const fn =
    typeof targetOrFn === 'function'
      ? //raw
        targetOrFn
      : //extract
        action != null
        ? extractActions(targetOrFn).invoke[action]
        : // will not happen
          undefined;

  if (fn === undefined) {
    throw new Error("Can't get the action function");
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
  return useActionAsync_imp(fn);
}

function useActionAsync_imp(
  fn: (...args: any[]) => any,
): AsyncAction<any, any[]> {
  const refExecutionContext = useRef({});

  const [state, setState] = useState<AsyncActionState<any>>({
    data: undefined,
    error: undefined,
    isLoading: false,
    isError: false,
  });

  const execute = useCallback((...args: any[]) => {
    const run = async () => {
      //new exec context
      const context = {};
      refExecutionContext.current = context;

      try {
        setState((s) => ({
          ...s,
          // data: undefined, //dont. keep old data until result is back
          error: undefined,
          isLoading: true,
          isError: false,
        }));

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument
        const res = await fn(...args);
        if (context !== refExecutionContext.current) {
          // result does not match last (user re-ran the action) - ignore.
          return;
        }
        setState((s) => ({
          ...s,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          data: res,
          error: undefined,
          isLoading: false,
          isError: false,
        }));
      } catch (error) {
        if (context !== refExecutionContext.current) {
          // result does not match last (user re-ran the action) - ignore.
          return;
        }
        setState((s) => ({
          ...s,
          // data: undefined, //dont. keep old data with error flag lit
          error: error,
          isLoading: false,
          isError: true,
        }));
      }
    };

    //just run
    run().catch(() => {});
  }, []);

  return { ...state, execute };
}

//-------------------------------------------------------
//-- types
//-------------------------------------------------------

export type AsyncActionState<T_Res> = {
  data: Awaited<T_Res> | undefined;
  error: unknown;
  isLoading: boolean;
  isError: boolean;
};
//-------------------------------------------------------

export type AsyncAction<
  T_Res,
  T_Params extends any[],
> = AsyncActionState<T_Res> & {
  execute: (...args: T_Params) => void;
};
//-------------------------------------------------------

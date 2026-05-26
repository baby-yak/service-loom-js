import type { ListenersErrorHandlingType } from '../core/types.js';

/**
 * Callback invoked whenever state changes.
 * @param state - The new state (deeply readonly).
 * @param prev  - The previous state, or `undefined` on the initial call immediately after subscribing.
 */
export type StateListener<S> = (state: S, prev: S | undefined) => void;

/** A function that derives a value `U` from state `S`. Used with `.select()`. */
export type StateSelectFn<S, U> = (state: S) => U;

//-------------------------------------------------------
// config and construction
//-------------------------------------------------------

export type StateListenersErrorHandlingType = ListenersErrorHandlingType<(error: unknown) => void>;

export type ListenersErrorHandlingType<T_Custom extends (...args: any) => void> =
  | 'ignore'
  | 'log'
  | 'warn'
  | 'error'
  | 'throw'
  | T_Custom;

/** Call to stop receiving state updates from a subscription. */
export type UnsubscribeFn = () => void;

export const _NOOP_: unique symbol = Symbol('__noop__');

/** empty object type but not flagged by linters */
export type Empty = Record<never, never>;

/** returns a type=true if T is any , type=false otherwise
 * usage type Test<T> = IsAny<T> extends true ? [type option 1] : [type option 2]
 */
export type IsAny<T> = 0 extends 1 & T ? true : false;

export type OrEmpty<T> =
  //
  undefined extends T
    ? Empty // undefined -> Empty
    : unknown extends T
      ? Empty // unknown -> Empty
      : T; // pass through T

/** convert type T:
 * if T is (any | never | undefined) => unknown
 * otherwise => T  */
export type OrUnknown<T> =
  IsAny<T> extends true
    ? unknown // any -> unknown
    : [T] extends [never]
      ? unknown // never -> unknown
      : T extends undefined
        ? unknown // undefined -> unknown
        : T; // pass through T

/** make any function in its async version  */
export type AsPromise<T> = T extends (...args: infer Args) => any
  ? (...args: Args) => Promise<Awaited<ReturnType<T>>>
  : never;

//-------------------------------------------------------
//-- Providers
//-------------------------------------------------------

/** general purpose provider with a typed client  */
export interface Provider<Client = any> {
  readonly client: Client;
}

/** extract client type from Provider<C>  */
export type ClientOf<T extends Provider> = T extends Provider<infer C> ? C : never;

/** simplify a compound type */
export type Simplify<T> = T extends any ? { [K in keyof T]: T[K] } : never;

import type { StateMap } from './types.js';

/**
 * a general StateClient interface.
 */
export interface RawStateClient<S extends StateMap> {
  //just make S generic be enforced by the type system:
  [NOOP]?: S;
}

const NOOP = Symbol('NOOP');

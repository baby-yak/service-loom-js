import type { _NOOP_ } from '../core/types.js';
import type { StateMap } from './types.js';

/**
 * a general StateClient interface.
 */
export interface RawStateClient<S extends StateMap> {
  //just make S generic be enforced by the type system:
  [_NOOP_]?: S;
}

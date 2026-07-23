import type { RawStateClient } from './rawStateClient.js';
import type { StateMap } from './types.js';

/**
 * a general StateProvider interface.
 */
export interface RawStateProvider<S extends StateMap> {
  readonly client: RawStateClient<S>;
}

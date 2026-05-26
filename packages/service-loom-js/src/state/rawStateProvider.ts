import type { RawStateClient } from './rawStateClient.js';

/**
 * a general StateProvider interface.
 */
export interface RawStateProvider<S> {
  readonly client: RawStateClient<S>;
}

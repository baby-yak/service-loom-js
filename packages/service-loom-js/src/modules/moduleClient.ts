import type { EMPTY } from '../core/types.js';
import type { EventClient } from '../events/index.js';
import type { ReactiveStateClient } from '../reactiveState/index.js';
import type { ModuleDescriptor, ModuleEvents, ModuleServiceClients, ModuleState } from './types.js';

/**
 * Read-only facade for a `Module`.
 *
 * Exposes reactive lifecycle state, lifecycle events, and the typed service clients —
 * without access to `start` or `stop`. Safe to pass to components and consumers.
 *
 * Obtained via `module.client`.
 */
export interface ModuleClient<M extends ModuleDescriptor = EMPTY> {
  readonly name: string;
  /** Reactive lifecycle state — subscribe to react to `isStarted` changes. */
  readonly state: ReactiveStateClient<ModuleState>;
  /** Lifecycle events — fired after `start()` and `stop()` complete. */
  readonly events: EventClient<ModuleEvents>;
  /** Typed `ServiceClient` map, keyed by the same names as the constructor input. */
  readonly services: ModuleServiceClients<M>;
}

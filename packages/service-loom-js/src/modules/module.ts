import type { EMPTY } from '../core/types.js';
import type { EventClient } from '../events/index.js';
import type { ReactiveStateClient } from '../reactiveState/index.js';
import type { ModuleClient } from './moduleClient.js';
import type { ModuleDescriptor, ModuleEvents, ModuleServiceClients, ModuleState } from './types.js';

/**
 * Orchestrates a set of services through a shared lifecycle.
 *
 * Accepts a map of named `Service` instances, wires up their typed clients,
 * and manages startup/shutdown sequencing across five lifecycle phases.
 * Within each phase all services run in parallel; phases are sequential.
 *
 * @example
 * // Explicit descriptor:
 * type App = {
 *   server: Service<IServer>;
 *   db: Service<IDb>;
 * };
 * const app = createModule<App>({
 *   server: new ServerService(),
 *   db: new DbService(),
 * });
 *
 * // Implicit — descriptor inferred from the provided services:
 * const app = createModule({
 *   server: new ServerService(),
 *   db: new DbService(),
 * });
 *
 * app.start();
 * app.services.server.actions.invoke.connect(8080);
 * app.stop();
 */
export interface Module<M extends ModuleDescriptor = EMPTY> {
  readonly name: string;
  readonly state: ReactiveStateClient<ModuleState>;
  readonly events: EventClient<ModuleEvents>;
  readonly services: ModuleServiceClients<M>;

  /** Returns a read-only `ModuleClient` safe to share with consumers. Does not expose `start`/`stop`. */
  readonly client: ModuleClient<M>;
  /** Run the full startup sequence: `init` → `start` → `afterStart`. */
  start(): void;
  /** Run the full shutdown sequence: `beforeStop` → `stop`. */
  stop(): void;
  /** resolves on 'started' (or immediately if already started), rejects on 'error' */
  waitForStart(): Promise<void>;
  /** resolves on 'stopped' (or immediately if already stopped), rejects on 'error' */
  waitForStop(): Promise<void>;
}

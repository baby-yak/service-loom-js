import type { ModuleClients, ModuleDescriptor } from './types.js';

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
 * await app.start();
 * app.services.server.actions.invoke.connect(8080);
 * await app.stop();
 */
export type Module<M extends ModuleDescriptor> = {
  readonly name: string;
  readonly services: ModuleClients<M>;

  /** Run the full startup sequence: `init` → `start` → `afterStart`. */
  start(): Promise<void>;
  /** Run the full shutdown sequence: `beforeStop` → `stop`. */
  stop(): Promise<void>;
};

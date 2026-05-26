import type { ServiceClient } from '../services/index.js';
import type { RawService } from '../services/rawService.js';

/** Reactive state exposed on every module. */
export type ModuleState = {
  /** `true` after `start()` completes successfully, `false` after `stop()`. */
  isStarted: boolean;
};

/** Lifecycle events emitted by a module. */
export type ModuleEvents = {
  /** Fired once after `start()` completes successfully. */
  started: () => void;
  /** Fired once after `stop()` completes successfully. */
  stopped: () => void;
  /** Fired when stat errored. */
  errorStarting: (error: Error) => void;
  /** Fired when stop errored. */
  errorStopping: (error: Error) => void;
};

/**
 * Describes the shape of a module — a map of names to `Service` instances.
 *
 * @example
 * type App = {
 *   server: Service<IServer>;
 *   db: Service<IDb>;
 * };
 */
export type ModuleDescriptor = {
  [key: string]: RawService<any, any>;
};

/** The typed `ServiceClient` map exposed on `module.services`.\
 * can accept either a ModuleDescriptor or a (typeof(myModule))\
 * and convert it to : `{ [name] : ServiceClient<descriptor> }`\
 * this is the type of the `myModule.services` fields
 */
export type ModuleServiceClients<M extends ModuleDescriptor> = {
  [K in keyof M]: ServiceToClient<M[K]>;
};

/** converts :
 * - `Service<D>` => `ServiceClient<D>`
 * - `RemoteService<D>` => `RemoteServiceClient<D>`
 * */
export type ServiceToClient<S extends RawService<any, any>> =
  S extends RawService<infer D, infer SP> ? ServiceClient<D, SP> : never;

/** Extracts the `ServiceDescriptor` from a `Service`. */
export type ExtractDescriptor<S extends RawService<any, any>> =
  S extends RawService<infer D, any> ? D : never;

//-------------------------------------------------------
//-------------------------------------------------------

/** Construction options for a `Module`. */
export type ModuleParams = {
  name?: string;
  /** Log each lifecycle phase transition for every service. Default: `false`. */
  verbose?: boolean;
};

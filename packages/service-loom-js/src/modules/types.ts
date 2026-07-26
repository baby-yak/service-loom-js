import type { Simplify } from '../core/internal/types.js';
import type { ClientOfService } from '../services/internal/types.js';
import type { AnyService, ValidConcreteService } from '../services/types.js';

/**
 * Describes the shape of a module — a map of names to `Service` instances.
 *
 * @example
 * type App = {
 *   server: Service<IServer>;
 *   db: Service<IDb>;
 *   db: RemoteService<IDb>;
 * };
 */
export type ModuleDescriptor = Record<string, AnyService>;

export type ModuleServices<M extends ModuleDescriptor> = {
  [K in keyof M]: ValidConcreteService<M[K]>;
};

export type ModuleClients<M extends ModuleDescriptor> = Simplify<{
  [K in keyof M]: ClientOfService<M[K]>;
}>;

//-------------------------------------------------------
//-------------------------------------------------------

/** Construction options for a `Module`. */
export type ModuleParams = {
  name?: string;
  /** Log each lifecycle phase transition for every service. Default: `false`. */
  verbose?: boolean;
};

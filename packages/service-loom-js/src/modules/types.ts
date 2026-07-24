import type { OrUnknown, Simplify } from '../core/types.js';
import type { ServiceBase } from '../services/internal/serviceBase.js';
import type { ActionsOf } from '../services/internal/types.js';
import type { RemoteService } from '../services/remoteService.js';
import type { Service } from '../services/service.js';
import type { ServiceClient } from '../services/serviceClient.js';
import type { ServiceDescriptor } from '../services/types.js';

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
export type ModuleDescriptor = Record<string, Service<any> | RemoteService<any>>;

export type ModuleServices<M extends ModuleDescriptor> = {
  [K in keyof M]: M[K] extends Service<infer D extends ServiceDescriptor<any>, any>
    ? // for local service - enforce implementing the actions directly
      M[K] & OrUnknown<ActionsOf<D>>
    : // for remote service - no enforcement
      M[K];
};

export type ModuleClients<M extends ModuleDescriptor> = Simplify<{
  [K in keyof M]: M[K] extends ServiceBase<ServiceDescriptor<any>, infer P>
    ? ServiceClient<P>
    : never;
}>;

//-------------------------------------------------------
//-------------------------------------------------------

/** Construction options for a `Module`. */
export type ModuleParams = {
  name?: string;
  /** Log each lifecycle phase transition for every service. Default: `false`. */
  verbose?: boolean;
};

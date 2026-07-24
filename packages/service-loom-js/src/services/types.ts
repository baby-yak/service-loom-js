import type { _ACTIONS_, _EVENTS_, _SHAPE_, _STATE_ } from '../core/internal/symbols.js';
import type { OrUnknown } from '../core/internal/types.js';
import type { Empty } from '../core/types.js';
import type { ActionsOf, ServiceShape } from './internal/types.js';
import type { RemoteService } from './remoteService.js';
import type { Service } from './service.js';

//-------------------------------------------------------
//-- service defs
//-------------------------------------------------------

export type AnyService = Service<any> | RemoteService<any>;

// the single service contract: actions + shape.
// the `extends undefined ? unknown` guard stops `& Actions` from collapsing to
// `never` when actions are opted out (`unknown` is the identity for `&`).
export type ServiceDescriptor<Shape extends ServiceShape = Empty> =
  //
  OrUnknown<Shape['actions']> & {
    [_SHAPE_]?: Shape | undefined;
    [_ACTIONS_]?: Shape['actions'] | undefined;
    [_STATE_]?: Shape['state'] | undefined;
    [_EVENTS_]?: Shape['events'] | undefined;
  };

export type ValidConcreteService<S extends AnyService> =
  S extends Service<infer D extends ServiceDescriptor<any>, any>
    ? // for local service - enforce implementing the actions directly
      S & OrUnknown<ActionsOf<D>>
    : // for remote service - no enforcement
      S;

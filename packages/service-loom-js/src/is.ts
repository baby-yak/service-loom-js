import type {
  ActionClient,
  ActionExecuter,
  ActionMap,
  RemoteActionExecuter,
} from './actions/index.js';
import type { RemoteActionClient } from './actions/remote/remoteActionClient.js';
import {
  _BRAND_ACTION_CLIENT_,
  _BRAND_ACTION_EXECUTER_,
  _BRAND_EVENT_CLIENT_,
  _BRAND_EVENT_EMITTER_,
  _BRAND_REACTIVE_STATE_,
  _BRAND_REACTIVE_STATE_CLIENT_,
  _BRAND_REMOTE_ACTION_CLIENT_,
  _BRAND_REMOTE_ACTION_EXECUTER_,
  _BRAND_REMOTE_SERVICE_,
  _BRAND_REMOTE_SERVICE_CLIENT_,
  _BRAND_SERVICE_,
  _BRAND_SERVICE_CLIENT_
} from './core/internal/symbols.js';
import type { EventClient } from './events/eventClient.js';
import type { EventEmitter } from './events/eventEmitter.js';
import type { EventMap } from './events/types.js';
import type { RemoteService, RemoteServiceClient } from './services/remoteService.js';
import type { Service, ServiceClient } from './services/service.js';
import type { ServiceDescriptor } from './services/types.js';
import type { ReactiveState } from './state/local/reactiveState.js';
import type { ReactiveStateClient } from './state/local/reactiveStateClient.js';
import type { StateMap } from './state/types.js';

function is<T>(x: unknown, verify: (x: T) => boolean): x is T {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
  return x != null && !!verify(x as T);
}

//-------------------------------------------------------
//--
//-------------------------------------------------------

export function isService<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return is<Service<D>>(x, (x) => x[_BRAND_SERVICE_]);
}
export function isRemoteService<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return is<RemoteService<D>>(x, (x) => x[_BRAND_REMOTE_SERVICE_]);
}

export function isServiceClient<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return is<ServiceClient<D>>(x, (x) => x[_BRAND_SERVICE_CLIENT_]);
}
export function isRemoteServiceClient<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return is<RemoteServiceClient<D>>(x, (x) => x[_BRAND_REMOTE_SERVICE_CLIENT_]);
}

//actions
export function isActionExecuter<A extends ActionMap = any>(x: unknown) {
  return is<ActionExecuter<A>>(x, (x) => x[_BRAND_ACTION_EXECUTER_]);
}
export function isActionClient<A extends ActionMap = any>(x: unknown) {
  return is<ActionClient<A>>(x, (x) => x[_BRAND_ACTION_CLIENT_]);
}
export function isRemoteActionExecuter<A extends ActionMap = any>(x: unknown) {
  return is<RemoteActionExecuter<A>>(x, (x) => x[_BRAND_REMOTE_ACTION_EXECUTER_]);
}
export function isRemoteActionClient<A extends ActionMap = any>(x: unknown) {
  return is<RemoteActionClient<A>>(x, (x) => x[_BRAND_REMOTE_ACTION_CLIENT_]);
}

//state
export function isReactiveState<S extends StateMap = any>(x: unknown) {
  return is<ReactiveState<S>>(x, (x) => x[_BRAND_REACTIVE_STATE_]);
}
export function isReactiveStateClient<S extends StateMap = any>(x: unknown) {
  return is<ReactiveStateClient<S>>(x, (x) => x[_BRAND_REACTIVE_STATE_CLIENT_]);
}

// export function isRemoteState<S extends StateMap = any>(x: unknown): x is ReactiveState<S> {
//   return is<ReactiveState<any>>(x, (x) => x[_BRAND_REMOTE_STATE_]);
// }
// export function isRemoteStateClient<S extends StateMap = any>(
//   x: unknown,
// ): x is ReactiveStateClient<S> {
//   return is<ReactiveStateClient<any>>(x, (x) => x[_BRAND_REMOTE_STATE_CLIENT_]);
// }

//events:
export function isEventEmitter<E extends EventMap = any>(x: unknown) {
  return is<EventEmitter<E>>(x, (x) => x[_BRAND_EVENT_EMITTER_]);
}
export function isEventClient<E extends EventMap = any>(x: unknown) {
  return is<EventClient<E>>(x, (x) => x[_BRAND_EVENT_CLIENT_]);
}

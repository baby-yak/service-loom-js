import type { ActionExecuter, ActionMap, RemoteActionExecuter } from './actions/index.js';

import {
  _ACTION_CLIENT_,
  _ACTION_EXECUTER_,
  _BRANDS_,
  _EVENT_CLIENT_,
  _EVENT_EMITTER_,
  _REACTIVE_STATE_,
  _REACTIVE_STATE_CLIENT_,
  _REMOTE_ACTION_CLIENT_,
  _REMOTE_ACTION_EXECUTER_,
  _REMOTE_SERVICE_,
  _REMOTE_SERVICE_CLIENT_,
  _REMOTE_STATE_,
  _REMOTE_STATE_CLIENT_,
  _SERVICE_,
  _SERVICE_CLIENT_,
} from './core/internal/symbols.js';
import type { EventClient } from './events/eventClient.js';
import type { EventEmitter } from './events/eventEmitter.js';
import type { EventMap } from './events/types.js';
import type { RemoteService, RemoteServiceClient } from './services/remoteService.js';
import type { Service, ServiceClient } from './services/service.js';
import type { ServiceDescriptor } from './services/types.js';
import type { RemoteState, RemoteStateClient } from './state/index.js';
import type { ReactiveState } from './state/local/reactiveState.js';
import type { ReactiveStateClient } from './state/local/reactiveStateClient.js';
import type { StateMap } from './state/types.js';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
function isWithBrand<T>(x: unknown, brands: symbol[]): x is T {
  if (!x) return false;

  const target = x as { [_BRANDS_]: any };
  if (!target[_BRANDS_]) return false;
  if (!Array.isArray(target[_BRANDS_])) return false;

  for (const b of brands) {
    if (target[_BRANDS_].includes(b)) {
      return true;
    }
  }
  return false;
}

//-------------------------------------------------------
//--
//-------------------------------------------------------

export function isService<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return isWithBrand<Service<D>>(x, [_SERVICE_]);
}
export function isRemoteService<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return isWithBrand<RemoteService<D>>(x, [_REMOTE_SERVICE_]);
}

export function isServiceClient<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return isWithBrand<ServiceClient<D>>(x, [_SERVICE_CLIENT_]);
}
export function isRemoteServiceClient<D extends ServiceDescriptor<any> = any>(x: unknown) {
  return isWithBrand<RemoteServiceClient<D>>(x, [_REMOTE_SERVICE_CLIENT_]);
}

//actions
export function isActionExecuter<A extends ActionMap = any>(x: unknown) {
  return isWithBrand<ActionExecuter<A>>(x, [_ACTION_EXECUTER_]);
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function isActionClient<A extends ActionMap = any>(x: unknown) {
  return isWithBrand<A>(x, [_ACTION_CLIENT_]);
}
export function isRemoteActionExecuter<A extends ActionMap = any>(x: unknown) {
  return isWithBrand<RemoteActionExecuter<A>>(x, [_REMOTE_ACTION_EXECUTER_]);
}
// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export function isRemoteActionClient<A extends ActionMap = any>(x: unknown) {
  return isWithBrand<A>(x, [_REMOTE_ACTION_CLIENT_]);
}

//state
export function isReactiveState<S extends StateMap = any>(x: unknown) {
  return isWithBrand<ReactiveState<S>>(x, [_REACTIVE_STATE_]);
}
export function isReactiveStateClient<S extends StateMap = any>(x: unknown) {
  return isWithBrand<ReactiveStateClient<S>>(x, [_REACTIVE_STATE_CLIENT_]);
}

export function isRemoteState<S extends StateMap = any>(x: unknown) {
  return isWithBrand<RemoteState<S>>(x, [_REMOTE_STATE_]);
}
export function isRemoteStateClient<S extends StateMap = any>(x: unknown) {
  return isWithBrand<RemoteStateClient<S>>(x, [_REMOTE_STATE_CLIENT_]);
}

//events:
export function isEventEmitter<E extends EventMap = any>(x: unknown) {
  return isWithBrand<EventEmitter<E>>(x, [_EVENT_EMITTER_]);
}
export function isEventClient<E extends EventMap = any>(x: unknown) {
  return isWithBrand<EventClient<E>>(x, [_EVENT_CLIENT_]);
}

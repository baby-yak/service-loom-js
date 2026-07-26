import type { ActionClient } from './actions/actionClient.js';
import type { ActionExecuter } from './actions/actionExecuter.js';
import type { ActionMap } from './actions/types.js';
import {
  _BRAND_ACTION_EXECUTER,
  _BRAND_ACTION_EXECUTER_CLIENT,
  _BRAND_EVENT_EMITTER,
  _BRAND_EVENT_EMITTER_CLIENT,
  _BRAND_REACTIVE_STATE,
  _BRAND_REACTIVE_STATE_CLIENT,
  _BRAND_REMOTE_SERVICE_,
  _BRAND_REMOTE_SERVICE_CLIENT,
  _BRAND_SERVICE_,
  _BRAND_SERVICE_CLIENT_,
} from './core/internal/symbols.js';
import type { EventClient } from './events/eventClient.js';
import type { EventEmitter } from './events/eventEmitter.js';
import type { EventMap } from './events/types.js';
import type { ReactiveState } from './reactiveState/reactiveState.js';
import type { ReactiveStateClient } from './reactiveState/reactiveStateClient.js';
import type { RemoteService, RemoteServiceClient } from './services/remoteService.js';
import type { Service, ServiceClient } from './services/service.js';
import type { ServiceDescriptor } from './services/types.js';
import type { StateMap } from './state/types.js';

function is<T>(x: unknown, verify: (x: T) => boolean): x is T {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-conversion
  return x != null && !!verify(x as T);
}

export function isService<D extends ServiceDescriptor<any> = any>(x: unknown): x is Service<D> {
  return is<Service<any>>(x, (x) => x[_BRAND_SERVICE_]);
}
export function isRemoteService<D extends ServiceDescriptor<any> = any>(
  x: unknown,
): x is RemoteService<D> {
  return is<RemoteService<any>>(x, (x) => x[_BRAND_REMOTE_SERVICE_]);
}

export function isServiceClient<D extends ServiceDescriptor<any> = any>(
  x: unknown,
): x is ServiceClient<D> {
  return is<ServiceClient<any>>(x, (x) => x[_BRAND_SERVICE_CLIENT_]);
}
export function isRemoteServiceClient<D extends ServiceDescriptor<any> = any>(
  x: unknown,
): x is RemoteServiceClient<D> {
  return is<RemoteServiceClient<any>>(x, (x) => x[_BRAND_REMOTE_SERVICE_CLIENT]);
}

//actions
export function isActionExecuter<A extends ActionMap = any>(x: unknown): x is ActionExecuter<A> {
  return is<ActionExecuter<any>>(x, (x) => x[_BRAND_ACTION_EXECUTER]);
}
export function isActionClient<A extends ActionMap = any>(x: unknown): x is ActionClient<A> {
  return is<ActionClient<any>>(x, (x) => x[_BRAND_ACTION_EXECUTER_CLIENT]);
}
//state
export function isReactiveState<S extends StateMap = any>(x: unknown): x is ReactiveState<S> {
  return is<ReactiveState<any>>(x, (x) => x[_BRAND_REACTIVE_STATE]);
}
export function isReactiveStateClient<S extends StateMap = any>(
  x: unknown,
): x is ReactiveStateClient<S> {
  return is<ReactiveStateClient<any>>(x, (x) => x[_BRAND_REACTIVE_STATE_CLIENT]);
}
//events:
export function isEventEmitter<E extends EventMap = any>(x: unknown): x is EventEmitter<E> {
  return is<EventEmitter<any>>(x, (x) => x[_BRAND_EVENT_EMITTER]);
}
export function isEventClient<E extends EventMap = any>(x: unknown): x is EventClient<E> {
  return is<EventClient<any>>(x, (x) => x[_BRAND_EVENT_EMITTER_CLIENT]);
}

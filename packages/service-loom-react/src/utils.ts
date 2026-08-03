import {
  isActionClient,
  isActionExecuter,
  isEventClient,
  isEventEmitter,
  isReactiveState,
  isReactiveStateClient,
  isService,
  isServiceClient,
  type ActionExecuter,
  type ActionMap,
  type EventClient,
  type EventEmitter,
  type EventMap,
  type ReactiveState,
  type ReactiveStateClient,
  type Service,
  type ServiceClient,
  type ServiceDescriptor,
} from '@baby-yak/service-loom-js';

export function extractActions<T_ActionMap extends ActionMap>(
  target:
    | ActionExecuter<T_ActionMap>
    | T_ActionMap
    | Service<ServiceDescriptor<{ actions: T_ActionMap }>>
    | ServiceClient<ServiceDescriptor<{ actions: T_ActionMap }>>,
): T_ActionMap {
  if (isActionExecuter(target)) {
    return target.invoke;
  }
  if (isActionClient<ActionMap>(target)) {
    return target;
  }
  if (isService<ServiceDescriptor<{ actions: T_ActionMap }>>(target)) {
    return target.actions.invoke as T_ActionMap;
  }
  if (isServiceClient<ServiceDescriptor<{ actions: T_ActionMap }>>(target)) {
    return target.actions as T_ActionMap;
  }

  throw new Error('unknown option in extractActions()');
}

export function extractState<S>(
  target:
    | ReactiveState<S>
    | ReactiveStateClient<S>
    | Service<ServiceDescriptor<{ state: S }>>
    | ServiceClient<ServiceDescriptor<{ state: S }>>,
): ReactiveStateClient<S> {
  if (isReactiveState(target)) {
    return target.client;
  }
  if (isReactiveStateClient(target)) {
    return target;
  }
  if (isService(target)) {
    return target.state.client;
  }
  if (isServiceClient(target)) {
    return target.state;
  }

  throw new Error('unknown option in extractState()');
}

export function extractEvents<E extends EventMap>(
  target:
    | EventEmitter<E>
    | EventClient<E>
    | Service<ServiceDescriptor<{ events: E }>>
    | ServiceClient<ServiceDescriptor<{ events: E }>>,
): EventClient<E> {
  if (isEventEmitter(target)) {
    return target.client;
  }
  if (isEventClient(target)) {
    return target;
  }
  if (isService(target)) {
    return target.events.client;
  }
  if (isServiceClient(target)) {
    return target.events;
  }

  throw new Error('unknown option in extractEvents()');
}

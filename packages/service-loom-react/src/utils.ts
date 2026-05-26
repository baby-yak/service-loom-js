import {
  type ActionClient,
  type ActionMap,
  type EventClient,
  type EventMap,
  type RawStateClient,
  type RawStateProvider,
  type ServiceClient,
  isServiceClient
} from '@baby-yak/service-loom-js';

export function extractActions<A extends ActionMap>(
  target: ActionClient<A> | ServiceClient<{ actions: A }, any>,
): ActionClient<A> {
  if (isServiceClient(target)) {
    return target.actions as ActionClient<A>;
  }
  return target;
}
export function extractEvents<E extends EventMap>(
  target: EventClient<E> | ServiceClient<{ events: E }, any>,
): EventClient<E> {
  if (isServiceClient(target)) {
    return target.events as EventClient<E>;
  }
  return target;
}
export function extractState<S>(
  target:
    | RawStateClient<S>
    | ServiceClient<{ state: S }, RawStateProvider<S>>,
): RawStateClient<S> {
  if (isServiceClient(target)) {
    return target.state;
  }
  return target;
}

import {
  type EventClient,
  type EventListener,
  type EventMap,
  type EventNames,
  type ServiceClient,
} from '@baby-yak/service-loom-js';
import { type DependencyList, useEffect } from 'react';
import { extractEvents } from '../utils.js';

/**
 * Subscribes to a an event and calls the listener whenever it fires.
 * The subscription is re-created when `deps` changes (same semantics as `useEffect`).
 *
 * @param target an `EventClient` or a `ServiceClient` with events
 * @param event the event name to subscribe to
 * @param listener callback invoked each time the event fires
 * @param deps controls when the subscription is re-created — include any values the listener closes over
 */
export function useEvent<
  EVENTS extends EventMap,
  EVENTNAME extends EventNames<EVENTS>,
>(
  target:
    | EventClient<EVENTS>
    | ServiceClient<{ events: EVENTS }, any>,
  event: EVENTNAME,
  listener: EventListener<EVENTS, EVENTNAME>,
  deps?: DependencyList,
) {
  useEffect(() => {
    return extractEvents(target).subscribe(event, listener);
  }, deps ?? []);
}

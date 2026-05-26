import type { ListenersErrorHandlingType } from '../core/types.js';
import type { CombinedEvents } from './internal/types.js';
import type { EventClient } from './eventClient.js';

export type EventMap = {
  [event: string]: (...args: any[]) => void;
};

export type EventListener<
  T_EventMap extends EventMap,
  T_Event extends EventNames<T_EventMap>,
> = CombinedEvents<T_EventMap>[T_Event];

export type EventNames<T_Map extends EventMap> =
  keyof CombinedEvents<T_Map> & string;

export type EventParams<
  T_Map extends EventMap,
  T_Event extends EventNames<T_Map>,
> = Parameters<CombinedEvents<T_Map>[T_Event]>;

//-------------------------------------------------------
// config and construction
//-------------------------------------------------------
export type EventListenersErrorHandlingType =
  ListenersErrorHandlingType<(event: string, error: unknown) => void>;

/**
 * The result of `createListenerGroup()`.
 *
 * - `client` — an `EventClient` whose listeners are tracked as a group.
 *   Use it exactly like any other `EventClient`.
 * - `detachGroup(event?)` — removes every listener registered through `client`.
 *   Pass an event name to limit removal to that event only.
 *   Safe to call multiple times; a second call after all listeners have been
 *   removed is a no-op.
 */
export type EventGroupContext<
  T_EventMap extends EventMap = EventMap,
> = {
  client: EventClient<T_EventMap>;
  detachGroup: (event?: EventNames<T_EventMap>) => void;
};

import type { EventMap, EventNames } from '../types.js';

export type GroupToken = {
  name: string;
};

export const RESERVED_EVENTS = ['newListener', 'removeListener', '*'] as const;

export type EventMap_Reserved<T_EventMap extends EventMap = EventMap> = {
  newListener: (event: EventNames<T_EventMap>, listener: (...args: any[]) => void) => void;
  removeListener: (event: EventNames<T_EventMap>, listener: (...args: any[]) => void) => void;
  '*': (event: EventNames<T_EventMap>, ...args: any[]) => void;
};

export type EventNames_Reserved = keyof EventMap_Reserved;

export type EventParams_Reserved<
  T_Map extends EventMap,
  T_Event extends EventNames_Reserved,
> = Parameters<EventMap_Reserved<T_Map>[T_Event]>;

/** if this raises a TS error: \
 * <RESERVED_EVENTS> elements != <ReservedEvents> keys \
 * fix it - match the two types
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ASSERTION_: _AssertSync = true;

export function isReservedEventName(event: string) {
  return RESERVED_EVENTS.includes(event as (typeof RESERVED_EVENTS)[number]);
}

// sync guard — errors if the two diverge
type _AssertSync = (typeof RESERVED_EVENTS)[number] extends keyof EventMap_Reserved
  ? keyof EventMap_Reserved extends (typeof RESERVED_EVENTS)[number]
    ? true
    : never
  : never;

//-------------------------------------------------------
// combined utils types
//-------------------------------------------------------

export type CombinedEvents<T_EventMap extends EventMap> = T_EventMap &
  EventMap_Reserved<T_EventMap>;

export type EventMap_Pure<T_EventMap extends EventMap> = Omit<T_EventMap, EventNames_Reserved>;

export type EventNames_Pure<T_EventMap extends EventMap> = keyof EventMap_Pure<T_EventMap> & string;

export type EventParams_Pure<
  T_Map extends EventMap,
  T_Event extends EventNames_Pure<T_Map>,
> = Parameters<EventMap_Pure<T_Map>[T_Event]>;

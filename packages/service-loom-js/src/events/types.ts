import type { ListenersErrorHandlingType } from '../core/types.js';
import type { CombinedEvents } from './internal/types.js';

export type EventMap = {
  [event: string]: (...args: any[]) => void;
};

export type EventListener<
  T_EventMap extends EventMap,
  T_Event extends EventNames<T_EventMap>,
> = CombinedEvents<T_EventMap>[T_Event] extends (...args: infer Args) => any
  ? //loosen the return type - can be void / promise or anything else
    (...args: Args) => unknown
  : never;

export type EventNames<T_Map extends EventMap> = keyof CombinedEvents<T_Map> & string;

export type EventParams<T_Map extends EventMap, T_Event extends EventNames<T_Map>> = Parameters<
  CombinedEvents<T_Map>[T_Event]
>;

//-------------------------------------------------------
// config and construction
//-------------------------------------------------------
export type EventListenersErrorHandlingType = ListenersErrorHandlingType<
  (event: string, error: unknown) => void
>;

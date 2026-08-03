import { _EVENT_CLIENT_, _BRANDS_ } from '../core/internal/symbols.js';
import { EventSourceBase } from './internal/eventSourceBase.js';
import type { EventMap } from './types.js';

export abstract class EventClient<T_EventMap extends EventMap> extends EventSourceBase<T_EventMap> {
  readonly [_BRANDS_] = [_EVENT_CLIENT_];
}

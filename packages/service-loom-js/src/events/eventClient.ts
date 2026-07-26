import { _BRAND_EVENT_EMITTER_CLIENT } from '../core/internal/symbols.js';
import { EventSourceBase } from './internal/eventSourceBase.js';
import type { EventMap } from './types.js';

export abstract class EventClient<T_EventMap extends EventMap> extends EventSourceBase<T_EventMap> {
  readonly [_BRAND_EVENT_EMITTER_CLIENT] = true;
}

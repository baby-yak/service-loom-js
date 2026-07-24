import type { _ACTIONS_, _EVENTS_, _SHAPE_, _STATE_ } from '../core/symbols.js';
import type { Empty, OrUnknown } from '../core/types.js';
import type { ServiceShape } from './internal/types.js';

//-------------------------------------------------------
//-- service defs
//-------------------------------------------------------

// the single service contract: actions + shape.
// the `extends undefined ? unknown` guard stops `& Actions` from collapsing to
// `never` when actions are opted out (`unknown` is the identity for `&`).

export type ServiceDescriptor<Shape extends ServiceShape = Empty> =
  //
  OrUnknown<Shape['actions']> & {
    [_SHAPE_]?: Shape | undefined;
    [_ACTIONS_]?: Shape['actions'] | undefined;
    [_STATE_]?: Shape['state'] | undefined;
    [_EVENTS_]?: Shape['events'] | undefined;
  };

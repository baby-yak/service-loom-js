import type { ActionHandler, ActionMap, ActionNames, CatchAllActionHandler } from '../types.js';

export class ActionExecutionMapping<T_Map extends ActionMap> {
  mapping: Map<ActionNames<T_Map>, ActionHandler<T_Map, any>> = new Map();
  executionTarget: T_Map | undefined = undefined;
  catchAllHandler: CatchAllActionHandler | undefined = undefined;
}

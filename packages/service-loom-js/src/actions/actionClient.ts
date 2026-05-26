import type { ActionMap, Invoker } from './types.js';

export interface ActionClient<T_Map extends ActionMap = ActionMap> {
  /**
   * invoke actions with this
   */
  readonly invoke: Invoker<T_Map>;
}

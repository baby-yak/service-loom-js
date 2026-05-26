import type { ActionClient } from '../actionClient.js';
import type { ActionMap, Invoker } from '../types.js';

export class ActionsClient_imp<T_Map extends ActionMap = ActionMap> implements ActionClient<T_Map> {
  readonly invoke: Invoker<T_Map>;

  constructor(invoke: Invoker<T_Map>) {
    this.invoke = invoke;
  }
}

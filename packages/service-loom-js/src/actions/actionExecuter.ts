import type { ActionClient } from './actionClient.js';
import { ActionsClient_imp } from './internal/actionsClient_imp.js';
import { ActionExecutionMapping } from './internal/types.js';
import { createInvoker } from './internal/utils.js';
import type {
  ActionHandler,
  ActionMap,
  ActionNames,
  CatchAllActionHandler,
  Invoker,
} from './types.js';

//export type ActionsConstructionParams = {};
export type ActionExecuterParams = object;

export class ActionExecuter<T_Map extends ActionMap = ActionMap> implements ActionClient<T_Map> {
  /**
   * invoke actions with this
   */
  readonly invoke: Invoker<T_Map>;

  private _exec = new ActionExecutionMapping<T_Map>();
  readonly client: ActionClient<T_Map>;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_params?: ActionExecuterParams) {
    //create the invoker
    this.invoke = createInvoker(this._exec);
    this.client = new ActionsClient_imp(this.invoke);
  }

  //-------------------------------------------------------
  //-- setHandler
  //-------------------------------------------------------
  /**
   *
   * @param action * a catch all action handler
   * @param handlerFn the function to handle it
   */
  setHandler(action: '*', handlerFn: CatchAllActionHandler): this;

  /**
   *
   * @param action the action name
   * @param handlerFn the function to handle it
   */
  setHandler<T_Action extends ActionNames<T_Map>>(
    action: T_Action,
    handlerFn: ActionHandler<T_Map, T_Action>,
  ): this;
  /**
   *
   * @param handler map of handlers { "action": handler }. this can be an object or class instance (or this)
   */
  setHandler(handler: T_Map): this;

  setHandler(action_or_handler: unknown, handlerFn?: unknown): this {
    //null check
    if (action_or_handler == null) {
      throw new Error("Handler can't be null");
    }

    //handler executor object
    if (typeof action_or_handler === 'object') {
      const handler = action_or_handler as T_Map & ActionMap;
      return this._setHandler_obj(handler);
    }

    //handler executor object
    if (action_or_handler === '*') {
      const handler = handlerFn as CatchAllActionHandler;
      return this._setHandler_catchAll(handler);
    }

    //handler function for a specific method
    const action = action_or_handler as string | number;
    return this._setHandler_fn(action, handlerFn as ActionHandler<T_Map, typeof action>);
  }

  //-------------------------------------------------------
  //-- internal
  //-------------------------------------------------------
  private _setHandler_fn<T_Action extends string | number>(
    action: T_Action,
    handlerFn: ActionHandler<T_Map, T_Action>,
  ) {
    this._exec.mapping.set(action, handlerFn);
    return this;
  }

  private _setHandler_obj(handler: T_Map) {
    this._exec.executionTarget = handler;
    return this;
  }
  private _setHandler_catchAll(handler: CatchAllActionHandler) {
    this._exec.catchAllHandler = handler;
    return this;
  }
}

import type {
  ActionExecuterParams,
  ActionHandler,
  ActionMap,
  ActionNames,
  CatchAllActionHandler,
} from '../types.js';
import type { ActionClientBase } from './actionClientBase.js';
import { ExecutionMapper } from './internal/ExecutionMapper.js';

export class ActionExecuterBase<T_Map extends ActionMap, T_Client extends ActionClientBase<T_Map>> {
  private _exec: ExecutionMapper<T_Map, T_Client>;
  readonly invoke: T_Client;

  constructor(_params?: ActionExecuterParams, ...clientBrandProp: (string | symbol)[]) {
    //create the invoker
    this._exec = new ExecutionMapper<T_Map, T_Client>();
    this.invoke = this._exec.createProxyClient(...clientBrandProp);
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
      this._exec.setHandler_obj(handler);
      return this;
    }

    // catch-all handler
    if (action_or_handler === '*') {
      const handler = handlerFn as CatchAllActionHandler;
      this._exec.setHandler_catchAll(handler);
      return this;
    }

    //handler function for a specific method
    if (typeof action_or_handler === 'string' || typeof action_or_handler === 'number') {
      const action = action_or_handler;
      this._exec.setHandler_fn(action, handlerFn as ActionHandler<T_Map, typeof action>);
      return this;
    }

    throw new Error('unsupported handler type');
  }
}

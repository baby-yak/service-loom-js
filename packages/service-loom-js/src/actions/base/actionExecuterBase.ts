import { _BRANDS_ } from '../../core/internal/symbols.js';
import type {
  ActionExecuterParams,
  ActionHandler,
  ActionMap,
  ActionNames,
  CatchAllActionHandler,
} from '../types.js';
import { ExecutionMapper } from './executionMapper.js';

export abstract class ActionExecuterBase<T_Map extends ActionMap> {
  [_BRANDS_]: symbol[];
  private _exec: ExecutionMapper<T_Map>;
  readonly invoke: T_Map;

  constructor(_params: ActionExecuterParams | undefined, brands: symbol[], clientBrands: symbol[]) {
    //create the invoker
    this[_BRANDS_] = brands;

    this._exec = new ExecutionMapper<T_Map>();
    this.invoke = this._exec.createProxyClient(clientBrands);
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

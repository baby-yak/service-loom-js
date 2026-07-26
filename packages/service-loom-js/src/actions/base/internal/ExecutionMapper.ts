import type { ActionHandler, ActionMap, ActionNames, CatchAllActionHandler } from '../../types.js';
import type { ActionClientBase } from '../actionClientBase.js';

// eslint-disable-next-line @typescript-eslint/no-unnecessary-type-parameters
export class ExecutionMapper<T_Map extends ActionMap, T_Client extends ActionClientBase<any>> {
  private mapping: Map<ActionNames<T_Map>, ActionHandler<T_Map, any>> = new Map();
  private executionTarget: T_Map | undefined = undefined;
  private catchAllHandler: CatchAllActionHandler | undefined = undefined;

  // for every action - a bound handler (per proxy) so it wont re-create a new function every time we access it
  // this is also very important in react when the new function reference means a new render.
  private boundHandlersCache_exeTarget = new Map<ActionNames<T_Map>, ActionHandler<T_Map, any>>();
  private boundHandlersCache_catchAll = new Map<ActionNames<T_Map>, ActionHandler<T_Map, any>>();

  //handlers:

  setHandler_fn<T_Action extends string | number>(
    action: T_Action,
    handlerFn: ActionHandler<T_Map, T_Action>,
  ) {
    if (this.mapping.get(action) === handlerFn) {
      return;
    }

    this.mapping.set(action, handlerFn);
  }

  setHandler_obj(handler: T_Map) {
    if (this.executionTarget === handler) {
      return;
    }

    this.executionTarget = handler;
    //also clear bound function cache
    this.boundHandlersCache_exeTarget.clear();
  }
  setHandler_catchAll(handler: CatchAllActionHandler) {
    if (this.catchAllHandler === handler) {
      return;
    }

    this.catchAllHandler = handler;
    //also clear bound function cache
    this.boundHandlersCache_catchAll.clear();
  }
  //proxy:

  createProxyClient(...brandProps: (string | symbol)[]): T_Client {
    const proxy: T_Client = new Proxy(
      {},
      {
        get: (target, prop) => {
          // branding
          for (const brandProp of brandProps) {
            if (brandProp === prop) {
              return true;
            }
          }

          //should only be string action names
          if (typeof prop !== 'string') {
            return undefined;
          }

          let handler: ActionHandler<T_Map, any> | undefined;

          //first look in mapping (this can also be viewed as overrides)
          handler = this.mapping.get(prop);
          if (handler) {
            return handler;
          }

          //then look in .executionTarget:
          //(return a bound method!)
          handler = this.executionTarget?.[prop] as ActionHandler<T_Map, any> | undefined;
          if (handler) {
            //from bound cache:
            const cache_action = this.boundHandlersCache_exeTarget.get(prop);
            if (cache_action) {
              return cache_action;
            }

            //cache miss - create bound function:
            handler = handler.bind(this.executionTarget) as ActionHandler<T_Map, any>;

            //cache it
            this.boundHandlersCache_exeTarget.set(prop, handler);

            return handler;
          }

          //fall back to default handler if exists:
          const fallback = this.catchAllHandler;
          if (fallback != null) {
            //from bound cache:
            const cache_action = this.boundHandlersCache_catchAll.get(prop);
            if (cache_action) {
              return cache_action;
            }

            //cache miss - create bound function:
            // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument
            handler = ((...args: any[]) => fallback(prop, ...args)) as ActionHandler<T_Map, any>;

            //cache it
            this.boundHandlersCache_catchAll.set(prop, handler);

            return handler;
          }

          //oh my
          throw new Error(`Action [${prop}] was not implemented`);
        },
      },
    ) as T_Client;

    return proxy;
  }
}

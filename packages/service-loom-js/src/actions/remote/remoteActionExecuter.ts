import type { ActionsProvider } from '../../core/internal/providerTypes.js';
import { _REMOTE_ACTION_CLIENT_, _REMOTE_ACTION_EXECUTER_ } from '../../core/internal/symbols.js';
import { ActionExecuterBase } from '../base/actionExecuterBase.js';
import type { ActionExecuterParams, ActionMap, ActionParams } from '../types.js';
import type { RemoteActionHandler } from './remoteActionHandler.js';
import type { RemoteActionMap } from './types.js';

export class RemoteActionExecuter<T_Map extends ActionMap>
  extends ActionExecuterBase<RemoteActionMap<T_Map>>
  implements ActionsProvider<RemoteActionMap<T_Map>>
{
  constructor(handler: RemoteActionHandler<T_Map>, _params?: ActionExecuterParams) {
    super(_params, [_REMOTE_ACTION_EXECUTER_], [_REMOTE_ACTION_CLIENT_]);

    //pass through handler
    this.setHandler('*', (action: string, ...args: ActionParams<T_Map, string>) =>
      handler.onAction(action, ...args),
    );
  }
}

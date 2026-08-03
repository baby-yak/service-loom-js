import type { ActionsProvider } from '../../core/internal/providerTypes.js';
import { _ACTION_CLIENT_, _ACTION_EXECUTER_ } from '../../core/internal/symbols.js';
import { ActionExecuterBase } from '../base/actionExecuterBase.js';
import type { ActionExecuterParams, ActionMap } from '../types.js';

export class ActionExecuter<T_Map extends ActionMap>
  extends ActionExecuterBase<T_Map>
  implements ActionsProvider<T_Map>
{
  constructor(params?: ActionExecuterParams) {
    super(params, [_ACTION_EXECUTER_], [_ACTION_CLIENT_]);
  }
}

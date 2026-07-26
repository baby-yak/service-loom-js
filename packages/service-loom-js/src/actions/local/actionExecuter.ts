import type { ActionsProvider } from '../../core/internal/providerTypes.js';
import {
  _BRAND_ACTION_EXECUTER_,
  _BRAND_ACTION_CLIENT_,
} from '../../core/internal/symbols.js';
import { ActionExecuterBase } from '../base/actionExecuterBase.js';
import type { ActionExecuterParams, ActionMap } from '../types.js';
import type { ActionClient } from './actionClient.js';

export class ActionExecuter<T_Map extends ActionMap>
  extends ActionExecuterBase<T_Map, ActionClient<T_Map>>
  implements ActionsProvider<ActionClient<T_Map>>
{
  readonly [_BRAND_ACTION_EXECUTER_] = true;

  constructor(_params?: ActionExecuterParams) {
    super(_params, _BRAND_ACTION_CLIENT_);
  }
}

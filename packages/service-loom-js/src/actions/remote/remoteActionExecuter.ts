import {
  _BRAND_REMOTE_ACTION_EXECUTER_,
  _BRAND_REMOTE_ACTION_CLIENT_,
} from '../../core/internal/symbols.js';
import { ActionExecuterBase } from '../base/actionExecuterBase.js';
import type { ActionExecuterParams, ActionMap } from '../types.js';
import type { RemoteActionClient } from './remoteActionClient.js';
import type { RemoteActionMap } from './types.js';

export class RemoteActionExecuter<T_Map extends ActionMap> extends ActionExecuterBase<
  RemoteActionMap<T_Map>,
  RemoteActionClient<RemoteActionMap<T_Map>>
> {
  readonly [_BRAND_REMOTE_ACTION_EXECUTER_] = true;

  constructor(_params?: ActionExecuterParams) {
    super(_params, _BRAND_REMOTE_ACTION_CLIENT_);
  }
}

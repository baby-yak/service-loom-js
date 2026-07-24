import type { _BRAND_ACTION_EXECUTER_CLIENT } from '../core/internal/symbols.js';
import type { ActionMap, Invoker } from './types.js';

export type ActionClient<T_Map extends ActionMap> = //
  Invoker<T_Map> & { // actions
    [_BRAND_ACTION_EXECUTER_CLIENT]: true; // branding
  };

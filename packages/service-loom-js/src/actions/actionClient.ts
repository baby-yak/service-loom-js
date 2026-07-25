import type { _BRAND_ACTION_EXECUTER_CLIENT } from '../core/internal/symbols.js';
import type { ActionMap } from './types.js';

// mapped function + branding fields
export type ActionClient<T_Map extends ActionMap> = //
  {
    [K in keyof T_Map]: T_Map[K];
  } & {
    [_BRAND_ACTION_EXECUTER_CLIENT]: true; // branding
  };

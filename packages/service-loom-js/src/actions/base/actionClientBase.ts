import type { ActionMap } from '../types.js';

// mapped function + branding fields
export type ActionClientBase<T_Map extends ActionMap> = //
  {
    [K in keyof T_Map]: T_Map[K];
  };

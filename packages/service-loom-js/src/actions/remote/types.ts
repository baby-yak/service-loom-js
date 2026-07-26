import type { AsPromise } from '../../core/internal/types.js';
import type { ActionMap } from '../types.js';

export type RemoteActionMap<T_Map extends ActionMap> = {
  [K in keyof T_Map]: AsPromise<T_Map[K]>;
};

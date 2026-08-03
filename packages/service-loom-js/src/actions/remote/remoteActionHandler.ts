import type { ActionMap, ActionNames, ActionParams } from '../types.js';

export interface RemoteActionHandler<T_Map extends ActionMap> {
  onAction<K extends ActionNames<T_Map>>(action: K, ...args: ActionParams<T_Map, K>): Promise<any>;
}

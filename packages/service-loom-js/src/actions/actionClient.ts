import type { ActionMap, Invoker } from './types.js';

export type ActionClient<T_Map extends ActionMap> = Invoker<T_Map>;

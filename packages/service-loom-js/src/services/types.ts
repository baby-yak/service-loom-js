import type { ActionMap } from '../actions/index.js';
import type { EMPTY } from '../core/types.js';
import type { EventMap } from '../events/index.js';

/**
 * Describes the shape of a service — its state type, event map, and action map.
 *
 * Pass this as the type parameter to `Service<Desc>` to get full type inference
 * on `state`, `events`, and `actions`.
 *
 * @example
 * type IServer = {
 *   state: { address: string };
 *   events: { connected: () => void };
 *   actions: { connect(port: number): void };
 * };
 * class ServerService extends Service<IServer> { ... }
 */
export type ServiceDescriptor = {
  state?: any;
  events?: EventMap;
  actions?: ActionMap;
};

export type DefaultServiceDescriptor = {
  state: undefined;
  events: EMPTY;
  actions: EMPTY;
};

// Extract each field from a ServiceDescriptor, with sensible defaults
export type DescState<SD extends ServiceDescriptor> = SD['state'];

export type DescEvents<SD extends ServiceDescriptor> = SD['events'] extends EventMap
  ? SD['events']
  : EMPTY;

export type DescActions<SD extends ServiceDescriptor> = SD['actions'] extends ActionMap
  ? SD['actions']
  : EMPTY;

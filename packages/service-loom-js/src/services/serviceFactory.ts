import type { EMPTY } from '../core/types.js';
import { Service_imp } from './internal/service_imp.js';
import type { Service, ServiceParams } from './service.js';
import type { ServiceDescriptor } from './types.js';

//-------------------------------------------------------

// no state
export function createService(state?: undefined, options?: ServiceParams): Service<EMPTY>;

// infer S from state
export function createService<S>(state: S, options?: ServiceParams): Service<{ state: S }>;

// explicit ServiceDescriptor
export function createService<D extends ServiceDescriptor>(
  state: D['state'],
  options?: ServiceParams,
): Service<D>;

//implementation:

export function createService(...args: unknown[]): Service<any> {
  const state = args[0];
  const options = args[1] as ServiceParams | undefined;
  return new Service_imp(state, options);
}

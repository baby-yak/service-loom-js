import type { InferState } from '../state/index.js';
import type { RawStateProvider } from '../state/rawStateProvider.js';
import { RawService_imp } from './internal/rawService_imp.js';
import type { RawService, RawServiceParams } from './rawService.js';
import type { ServiceDescriptor } from './types.js';

//-------------------------------------------------------

// infer ServiceDescriptor {state:...} from stateProvider
export function createRawService<SProvider extends RawStateProvider<any>>(
  stateProvider: SProvider,
  options?: RawServiceParams,
): RawService<{ state: InferState<SProvider> }, SProvider>;

// explicit ServiceDescriptor
export function createRawService<
  D extends ServiceDescriptor,
  SProvider extends RawStateProvider<D['state']>,
>(stateProvider: SProvider, options?: RawServiceParams): RawService<D, SProvider>;

//implementation:

export function createRawService(
  stateProvider: RawStateProvider<any>,
  options?: RawServiceParams,
): RawService<any, any> {
  return new RawService_imp(stateProvider, options);
}

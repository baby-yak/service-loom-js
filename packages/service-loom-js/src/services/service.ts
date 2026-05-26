import type { ReactiveStateParams } from '../reactiveState/index.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
import { RawService, type RawServiceParams } from './rawService.js';
import type { ServiceDescriptor } from './types.js';

export type ServiceParams = RawServiceParams & {
  state?: ReactiveStateParams;
};

/**
 * default service implementation - in memory state with the {@link ReactiveState}  provider.
 */
export abstract class Service<D extends ServiceDescriptor> extends RawService<
  D,
  ReactiveState<D['state']>
> {
  constructor(initialState: D['state'], params?: ServiceParams) {
    const provider = new ReactiveState<D['state']>(initialState, params?.state);
    super(provider, params);
  }
}

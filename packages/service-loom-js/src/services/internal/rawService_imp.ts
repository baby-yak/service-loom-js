import type { RawStateProvider } from '../../state/rawStateProvider.js';
import { RawService } from '../rawService.js';
import type { ServiceDescriptor } from '../types.js';

/**
 * just a concrete implementation
 */
export class RawService_imp<
  D extends ServiceDescriptor,
  SProvider extends RawStateProvider<D['state']>,
> extends RawService<D, SProvider> {}

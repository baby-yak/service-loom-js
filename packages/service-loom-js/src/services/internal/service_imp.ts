import { Service } from '../service.js';
import type { ServiceDescriptor } from '../types.js';

/**
 * just a concrete implementation
 */
export class Service_imp<D extends ServiceDescriptor> extends Service<D> {}

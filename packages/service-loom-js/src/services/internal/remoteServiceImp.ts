import { RemoteService } from '../remoteService.js';
import type { ServiceDescriptor } from '../types.js';

export class RemoteServiceImp<
  Descriptor extends ServiceDescriptor<any>,
> extends RemoteService<Descriptor> {}



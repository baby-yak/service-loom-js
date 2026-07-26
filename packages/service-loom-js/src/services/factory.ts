import { RemoteServiceImp } from './internal/remoteServiceImp.js';
import type { StateArgs, StateOfWithFallback } from './internal/types.js';
import type { RemoteService } from './remoteService.js';
import type { ServiceDescriptor } from './types.js';

export function createRemoteService<Descriptor extends ServiceDescriptor<any>>(
  name?: string,
  ...args: StateArgs<StateOfWithFallback<Descriptor>>
): RemoteService<Descriptor> {
  return new RemoteServiceImp<Descriptor>(name, args[0] as StateOfWithFallback<Descriptor>);
}

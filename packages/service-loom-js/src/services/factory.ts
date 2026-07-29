import type { ServiceChannel } from '../transport/serviceChannel.js';
import { RemoteServiceImp } from './internal/remoteServiceImp.js';
import type { RemoteService } from './remoteService.js';
import type { ServiceDescriptor } from './types.js';

export function createRemoteService<Descriptor extends ServiceDescriptor<any>>(
  name: string,
  channel: ServiceChannel,
): RemoteService<Descriptor> {
  return new RemoteServiceImp<Descriptor>(name, channel);
}

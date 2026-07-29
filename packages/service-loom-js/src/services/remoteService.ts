import { RemoteActionExecuter } from '../actions/index.js';
import { _BRAND_REMOTE_SERVICE_, _BRAND_REMOTE_SERVICE_CLIENT_ } from '../core/internal/symbols.js';
import { EventEmitter } from '../events/eventEmitter.js';
import { RemoteState } from '../state/index.js';
import { ServiceChannelManager } from '../transport/internal/serviceChannelManager.js';
import type { ServiceChannel } from '../transport/serviceChannel.js';
import { ServiceBase } from './internal/serviceBase.js';
import { ServiceClientBase } from './internal/serviceClientBase.js';
import type {
  ActionsOfWithFallback,
  EventsOfWithFallback,
  StateArgs,
  StateOfWithFallback,
} from './internal/types.js';
import type { ServiceDescriptor } from './types.js';

//-------------------------------------------------------
//-- client
//-------------------------------------------------------

type Providers<Descriptor extends ServiceDescriptor<any>> = {
  actions: RemoteActionExecuter<ActionsOfWithFallback<Descriptor>>;
  state: RemoteState<StateOfWithFallback<Descriptor>>;
  events: EventEmitter<EventsOfWithFallback<Descriptor>>;
};

//-------------------------------------------------------
//-- client
//-------------------------------------------------------

export class RemoteServiceClient<
  Descriptor extends ServiceDescriptor<any>,
> extends ServiceClientBase<Providers<Descriptor>> {
  readonly [_BRAND_REMOTE_SERVICE_CLIENT_] = true;
}

//-------------------------------------------------------
//-- service
//-------------------------------------------------------

export abstract class RemoteService<Descriptor extends ServiceDescriptor<any>> extends ServiceBase<
  Descriptor,
  Providers<Descriptor>,
  RemoteServiceClient<Descriptor>
> {
  readonly [_BRAND_REMOTE_SERVICE_] = true;

  private channelManager: ServiceChannelManager;

  constructor(name: string, channel: ServiceChannel) {
    const actions = new RemoteActionExecuter<ActionsOfWithFallback<Descriptor>>();
    const state = new RemoteState<StateOfWithFallback<Descriptor>>();
    const events = new EventEmitter<EventsOfWithFallback<Descriptor>>();

    const client = new RemoteServiceClient<Descriptor>(
      name, //
      actions.invoke,
      state.client,
      events.client,
    );

    super(name, actions, state, events, client);

    this.channelManager = new ServiceChannelManager(this, name, channel);
  }

  disconnectChannel() {
    this.channelManager.disconnect();
  }
}

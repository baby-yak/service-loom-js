import { RemoteActionExecuter } from '../actions/index.js';
import { _REMOTE_SERVICE_, _REMOTE_SERVICE_CLIENT_ } from '../core/internal/symbols.js';
import { EventEmitter } from '../events/eventEmitter.js';
import { RemoteState } from '../state/index.js';
import { ServiceChannelManager } from '../transport/internal/serviceChannelManager.js';
import type { ServiceChannel } from '../transport/serviceChannel.js';
import { ServiceBase } from './internal/serviceBase.js';
import { ServiceClientBase } from './internal/serviceClientBase.js';
import type {
  ActionsOfWithFallback,
  EventsOfWithFallback,
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
> extends ServiceClientBase<Providers<Descriptor>> {}

//-------------------------------------------------------
//-- service
//-------------------------------------------------------

export abstract class RemoteService<Descriptor extends ServiceDescriptor<any>> extends ServiceBase<
  Descriptor,
  Providers<Descriptor>,
  RemoteServiceClient<Descriptor>
> {
  private channelManager: ServiceChannelManager;

  constructor(name: string, channel: ServiceChannel) {
    const actions = new RemoteActionExecuter<ActionsOfWithFallback<Descriptor>>({
      onAction(action, ...args) {
        return Promise.reject(new Error(`Action [${String(action)}] not implemented`));
      },
    });
    const state = new RemoteState<StateOfWithFallback<Descriptor>>();
    const events = new EventEmitter<EventsOfWithFallback<Descriptor>>();

    const client = new RemoteServiceClient<Descriptor>(
      name, //
      actions.invoke,
      state.client,
      events.client,
      [_REMOTE_SERVICE_CLIENT_],
    );

    super(name, actions, state, events, client, [_REMOTE_SERVICE_]);

    this.channelManager = new ServiceChannelManager(this, name, channel);
  }

  disconnectChannel() {
    this.channelManager.disconnect();
  }
}

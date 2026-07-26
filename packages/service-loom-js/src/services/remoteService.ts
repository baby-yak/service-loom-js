import { RemoteActionExecuter } from '../actions/index.js';
import { _BRAND_REMOTE_SERVICE_, _BRAND_REMOTE_SERVICE_CLIENT_ } from '../core/internal/symbols.js';
import { EventEmitter } from '../events/eventEmitter.js';
import { ReactiveState } from '../state/local/reactiveState.js';
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
  state: ReactiveState<StateOfWithFallback<Descriptor>>;
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

  constructor(name: string | undefined, ...args: StateArgs<StateOfWithFallback<Descriptor>>) {
    const initialState = args[0] as StateOfWithFallback<Descriptor>;

    const actions = new RemoteActionExecuter<ActionsOfWithFallback<Descriptor>>();
    const state = new ReactiveState<StateOfWithFallback<Descriptor>>(initialState);
    const events = new EventEmitter<EventsOfWithFallback<Descriptor>>();

    const client = new RemoteServiceClient<Descriptor>(
      name, //
      actions.invoke,
      state.client,
      events.client,
    );

    super(name, actions, state, events, client);

    this.actions.setHandler('*', (action, ...args) => {
      console.log(`invoked ${action} with ${args.toString()}`);
      throw new Error(`action not implemented [${name}.${action}]`);
    });
  }
}

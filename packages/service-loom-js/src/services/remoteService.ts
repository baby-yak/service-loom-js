import { ActionExecuter } from '../actions/actionExecuter.js';
import { _BRAND_REMOTE_SERVICE_, _BRAND_REMOTE_SERVICE_CLIENT } from '../core/internal/symbols.js';
import { EventEmitter } from '../events/eventEmitter.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
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
  actions: ActionExecuter<ActionsOfWithFallback<Descriptor>>;
  state: ReactiveState<StateOfWithFallback<Descriptor>>;
  events: EventEmitter<EventsOfWithFallback<Descriptor>>;
};

//-------------------------------------------------------
//-- client
//-------------------------------------------------------

export class RemoteServiceClient<
  Descriptor extends ServiceDescriptor<any>,
> extends ServiceClientBase<Providers<Descriptor>> {
  readonly [_BRAND_REMOTE_SERVICE_CLIENT] = true;
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

    const actions = new ActionExecuter<ActionsOfWithFallback<Descriptor>>();
    const state = new ReactiveState<StateOfWithFallback<Descriptor>>(initialState);
    const events = new EventEmitter<EventsOfWithFallback<Descriptor>>();

    const client = new RemoteServiceClient<Descriptor>(
      name, //
      actions.invoke,
      state.client,
      events.client,
    );

    super(name, actions, state, events, client);

    this.actions.setHandler(this as any as ActionsOfWithFallback<Descriptor>);
  }
}

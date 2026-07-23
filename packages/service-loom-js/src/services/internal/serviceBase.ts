import {
  _ACTIONS_,
  _BRAND_SERVICE_BASE_,
  _DESCRIPTOR_,
  _EVENTS_,
  _SHAPE_,
  _STATE_,
} from '../../core/symbols.js';
import type { ClientOf, Provider } from '../../core/types.js';
import type { ServiceClient } from '../serviceClient.js';
import type { ServiceDescriptor } from '../types.js';
import type {
  ActionsProviderOf,
  EventsProviderOf,
  ServiceProvidersShape,
  StateProviderOf,
} from './types.js';

export abstract class ServiceBase<
  Descriptor extends ServiceDescriptor<any>,
  Providers extends ServiceProvidersShape<Provider, Provider, Provider>,
> {
  // brand
  readonly [_BRAND_SERVICE_BASE_] = true;

  // define the Shape's vars so the contract is filled (auto generate will not try to make these on child classed)
  [_DESCRIPTOR_]?: Descriptor = undefined;

  [_SHAPE_] = undefined;
  [_ACTIONS_] = undefined;
  [_STATE_] = undefined;
  [_EVENTS_] = undefined;

  readonly name: string | undefined = undefined;

  readonly actions: ActionsProviderOf<Providers>;
  readonly state: StateProviderOf<Providers>;
  readonly events: EventsProviderOf<Providers>;

  readonly client: ServiceClient<Providers>;

  constructor(
    actions: ActionsProviderOf<Providers>,
    state: StateProviderOf<Providers>,
    events: EventsProviderOf<Providers>,
  ) {
    this.actions = actions;
    this.state = state;
    this.events = events;

    this.client = {
      name: this.name,
      actions: this.actions.client as ClientOf<ActionsProviderOf<Providers>>,
      state: this.state.client as ClientOf<StateProviderOf<Providers>>,
      events: this.events.client as ClientOf<EventsProviderOf<Providers>>,
    };
  }

  //-------------------------------------------------------
  //-- life cycle - optionally overridable by child classes
  //-------------------------------------------------------

  async onServiceInit(): Promise<void> {}
  async onServiceStart(): Promise<void> {}
  async onServiceAfterStart(): Promise<void> {}
  async onServiceBeforeStop(): Promise<void> {}
  async onServiceStop(): Promise<void> {}
}

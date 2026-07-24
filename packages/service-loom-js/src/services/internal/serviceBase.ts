import {
  _ACTIONS_,
  _BRAND_SERVICE_BASE_,
  _DESCRIPTOR_,
  _EVENTS_,
  _SHAPE_,
  _STATE_,
} from '../../core/symbols.js';
import type { ServiceClient } from '../serviceClient.js';
import type { ServiceDescriptor } from '../types.js';
import type {
  ActionsClientOf,
  ActionsProviderOf,
  EventsClientOf,
  EventsProviderOf,
  ServiceProvidersShape,
  StateClientOf,
  StateProviderOf,
} from './types.js';

export abstract class ServiceBase<
  Descriptor extends ServiceDescriptor<any>,
  Providers extends ServiceProvidersShape<any, any, any>,
> {
  // brand
  readonly [_BRAND_SERVICE_BASE_] = true;

  // define the Shape's vars so the contract is filled (auto generate will not try to make these on child classed)
  [_DESCRIPTOR_]?: Descriptor = undefined;

  [_SHAPE_] = undefined;
  [_ACTIONS_] = undefined;
  [_STATE_] = undefined;
  [_EVENTS_] = undefined;

  readonly name: string | undefined;

  readonly actions: ActionsProviderOf<Providers>;
  readonly state: StateProviderOf<Providers>;
  readonly events: EventsProviderOf<Providers>;

  /** shorthand for `this.actions.invoke` . i.e this.actions.invoke.foo() === this.invoke.foo()  */
  readonly invoke: ActionsClientOf<Providers>;

  readonly client: ServiceClient<Providers>;

  constructor(
    name: string | undefined,
    actions: ActionsProviderOf<Providers>,
    state: StateProviderOf<Providers>,
    events: EventsProviderOf<Providers>,
  ) {
    this.name = name;
    
    this.actions = actions;
    this.state = state;
    this.events = events;

    this.invoke = this.actions.invoke as ActionsClientOf<Providers>;

    this.client = {
      name: this.name,
      actions: this.actions.invoke as ActionsClientOf<Providers>,
      state: this.state.client as StateClientOf<Providers>,
      events: this.events.client as EventsClientOf<Providers>,
    };
  }

  //-------------------------------------------------------
  //-- life cycle - optionally overridable by child classes
  //-------------------------------------------------------

  onServiceInit(): Promise<void> | void {}
  onServiceStart(): Promise<void> | void {}
  onServiceAfterStart(): Promise<void> | void {}
  onServiceBeforeStop(): Promise<void> | void {}
  onServiceStop(): Promise<void> | void {}
}

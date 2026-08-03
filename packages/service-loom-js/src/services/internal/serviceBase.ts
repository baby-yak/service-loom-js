import {
  _ACTIONS_,
  _BRANDS_,
  _DESCRIPTOR_,
  _EVENTS_,
  _SHAPE_,
  _STATE_,
} from '../../core/internal/symbols.js';
import type { ServiceDescriptor } from '../types.js';
import type { ServiceClientBase } from './serviceClientBase.js';
import type {
  ActionsProviderOf,
  EventsProviderOf,
  ServiceProvidersShape,
  StateProviderOf,
} from './types.js';

export abstract class ServiceBase<
  Descriptor extends ServiceDescriptor<any>,
  Providers extends ServiceProvidersShape<any, any, any>,
  Client extends ServiceClientBase<Providers>,
> {
  // brand
  [_BRANDS_]: symbol[];

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

  readonly client: Client;

  constructor(
    name: string | undefined,
    actions: ActionsProviderOf<Providers>,
    state: StateProviderOf<Providers>,
    events: EventsProviderOf<Providers>,
    client: Client,
    brands: symbol[],
  ) {
    this[_BRANDS_] = brands;
    this.name = name;

    this.actions = actions;
    this.state = state;
    this.events = events;

    this.client = client;
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

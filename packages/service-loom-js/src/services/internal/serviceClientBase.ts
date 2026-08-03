import { _BRANDS_ } from '../../core/internal/symbols.js';
import type {
  ActionsClientOf,
  EventsClientOf,
  ServiceProvidersShape,
  StateClientOf,
} from './types.js';

export class ServiceClientBase<Providers extends ServiceProvidersShape<any, any, any>> {
  [_BRANDS_]: symbol[];

  readonly name: string | undefined;

  readonly actions: ActionsClientOf<Providers>;
  readonly state: StateClientOf<Providers>;
  readonly events: EventsClientOf<Providers>;

  constructor(
    name: string | undefined,
    actions: ActionsClientOf<Providers>,
    state: StateClientOf<Providers>,
    events: EventsClientOf<Providers>,
    brands: symbol[],
  ) {
    this[_BRANDS_] = brands;
    this.name = name;
    this.actions = actions;
    this.state = state;
    this.events = events;
  }
}

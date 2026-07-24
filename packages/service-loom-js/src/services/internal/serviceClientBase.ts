import { _BRAND_SERVICE_CLIENT_BASE_ } from '../../core/internal/symbols.js';
import type {
  ActionsClientOf,
  EventsClientOf,
  ServiceProvidersShape,
  StateClientOf,
} from './types.js';

export class ServiceClientBase<Providers extends ServiceProvidersShape<any, any, any>> {
  readonly [_BRAND_SERVICE_CLIENT_BASE_] = true;

  readonly name: string | undefined;

  readonly actions: ActionsClientOf<Providers>;
  readonly state: StateClientOf<Providers>;
  readonly events: EventsClientOf<Providers>;

  constructor(
    name: string | undefined,
    actions: ActionsClientOf<Providers>,
    state: StateClientOf<Providers>,
    events: EventsClientOf<Providers>,
  ) {
    this.name = name;
    this.actions = actions;
    this.state = state;
    this.events = events;
  }
}

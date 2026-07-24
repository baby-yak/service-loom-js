import type {
  ActionsClientOf,
  EventsClientOf,
  ServiceProvidersShape,
  StateClientOf,
} from './internal/types.js';

export interface ServiceClient<Providers extends ServiceProvidersShape<any, any, any>> {
  readonly name: string | undefined;

  readonly actions: ActionsClientOf<Providers>;
  readonly state: StateClientOf<Providers>;
  readonly events: EventsClientOf<Providers>;  
}

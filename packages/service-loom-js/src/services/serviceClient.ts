import type { ClientOf, Provider } from '../core/types.js';
import type {
  ActionsProviderOf,
  EventsProviderOf,
  ServiceProvidersShape,
  StateProviderOf,
} from './internal/types.js';

export interface ServiceClient<
  Providers extends ServiceProvidersShape<Provider, Provider, Provider>,
> {
  readonly name: string | undefined;

  readonly actions: ClientOf<ActionsProviderOf<Providers>>;
  readonly state: ClientOf<StateProviderOf<Providers>>;
  readonly events: ClientOf<EventsProviderOf<Providers>>;

  /** same as actions. nicer terminology */
  readonly invoke: ClientOf<ActionsProviderOf<Providers>>;
}

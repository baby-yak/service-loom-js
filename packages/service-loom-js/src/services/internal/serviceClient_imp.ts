import type { ActionClient, Invoker } from '../../actions/index.js';
import type { EventClient } from '../../events/index.js';
import type { RawStateProvider } from '../../state/index.js';
import type { RawService } from '../rawService.js';
import type { ServiceClient } from '../serviceClient.js';
import type { DescActions, DescEvents, DescState, ServiceDescriptor } from '../types.js';
import { MARKER_SERVICE_CLIENT } from './markers.js';

export class ServiceClient_imp<
  D extends ServiceDescriptor,
  SProvider extends RawStateProvider<DescState<D>>,
> implements ServiceClient<D, SProvider> {
  [MARKER_SERVICE_CLIENT] = true;
  /** Read-only access to the service's name. */
  readonly name: string;

  /** Shorthand for invoking actions on this service from within the implementation. */
  readonly invoke: Invoker<DescActions<D>>;

  /** Read-only access to the service's reactive state. */
  readonly state: SProvider['client'];

  /** Subscribe to events emitted by the service. */
  readonly events: EventClient<DescEvents<D>>;

  /** Invoke actions on the service. */
  readonly actions: ActionClient<DescActions<D>>;

  constructor(service: RawService<D, RawStateProvider<DescState<D>>>) {
    this.name = service.name;
    this.invoke = service.invoke;
    this.state = service.state.client;
    this.events = service.events.client;
    this.actions = service.actions.client;
  }
}

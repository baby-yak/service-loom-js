import { ActionExecuter, type ActionExecuterParams, type Invoker } from '../actions/index.js';
import { EventEmitter, type EventEmitterParams } from '../events/index.js';
import type { ModuleClient, ModuleDescriptor } from '../modules/index.js';
import type { RawStateProvider } from '../state/index.js';
import { MARKER_SERVICE } from './internal/markers.js';
import { ServiceClient_imp } from './internal/serviceClient_imp.js';
import { _SERVICE_LIFECYCLE_ } from './internal/types.js';
import type { ServiceClient } from './serviceClient.js';
import type { DescActions, DescEvents, DescState, ServiceDescriptor } from './types.js';

/** Advanced construction options passed to the underlying state, events, and actions subsystems. */
export type RawServiceParams = {
  name?: string;
  events?: EventEmitterParams;
  actions?: ActionExecuterParams;
};

export abstract class RawService<
  D extends ServiceDescriptor,
  SProvider extends RawStateProvider<DescState<D>>,
> {
  [MARKER_SERVICE] = true;

  private _module: ModuleClient | undefined;

  /** service name */
  readonly name: string;
  /**
   * Action executer — register handlers via `setHandler`.
   * Use `this.invoke` to call actions internally.
   */
  readonly actions: ActionExecuter<DescActions<D>>;
  /** Shorthand for invoking actions on this service from within the implementation. */
  readonly invoke: Invoker<DescActions<D>>;
  /** Reactive state — read and update the service's internal state. */
  readonly state: SProvider;
  /** Typed event emitter — emit and listen to service events internally. */
  readonly events: EventEmitter<DescEvents<D>>;
  /** Returns a read-only `ServiceClient` exposing state, events, and actions to external consumers. */
  readonly client: ServiceClient<D, SProvider>;

  constructor(stateProvider: SProvider, params?: RawServiceParams) {
    this.name = params?.name ?? 'untitled';
    this.state = stateProvider;
    this.events = new EventEmitter<DescEvents<D>>(params?.events);
    this.actions = new ActionExecuter<DescActions<D>>(params?.actions);
    this.invoke = this.actions.invoke;

    this.client = new ServiceClient_imp<D, SProvider>(this);
  }

  /**
   * Returns the parent `ModuleClient`, cast to the provided module descriptor type.
   *
   * Available from `onServiceStart` onward — throws if called earlier (constructor or `onServiceInit`).
   * Use a private getter to cache access and avoid repeating the cast:
   *
   * ```ts
   * private get module() { return this.getModule<AppModule>(); }
   * ```
   *
   * @throws if called before `onServiceStart`
   */
  getModule<M extends ModuleDescriptor>(): ModuleClient<M> {
    if (!this._module) {
      throw new Error(
        `[${this.constructor.name}] getModule() called before onServiceStart — module is not yet available`,
      );
    }
    return this._module as ModuleClient<M>;
  }

  //-------------------------------------------------------
  //-- LIFE CYCLE (used by the module when starting / stopping the services)
  //-------------------------------------------------------

  /** Called first during `module.start()`. Use for standalone setup (DB connect, config load, etc.). */
  onServiceInit(): void | Promise<void> {}
  /** Called after all services have initialized. Safe for cross-service wiring — listeners, state reads, action calls. */
  onServiceStart(): void | Promise<void> {}
  /** Called after all services have started. Use for final setup that depends on all services being fully running. */
  onServiceAfterStart(): void | Promise<void> {}
  /** Called first during `module.stop()`, while all services are still live. Use for cross-service ops before teardown. */
  onServiceBeforeStop(): void | Promise<void> {}
  /** Called after all services have completed `onBeforeStop`. Use for standalone teardown — close connections, unregister listeners. */
  onServiceStop(): void | Promise<void> {}

  //-------------------------------------------------------
  //-- INJECTION
  //-------------------------------------------------------

  // Bridge — only Module imports and uses this symbol
  [_SERVICE_LIFECYCLE_] = {
    setModule: (module: ModuleClient) => {
      this.setModule(module);
    },
  };

  private setModule(module: ModuleClient) {
    this._module = module;
  }
}

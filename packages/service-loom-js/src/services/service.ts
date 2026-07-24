import { ActionExecuter } from '../actions/actionExecuter.js';
import { _BRAND_SERVICE_, _BRAND_SERVICE_CLIENT_, _DEPENDENCIES_ } from '../core/internal/symbols.js';
import type { Empty } from '../core/types.js';
import { EventEmitter } from '../events/eventEmitter.js';
import type { Module } from '../modules/module.js';
import type { ModuleClients, ModuleDescriptor } from '../modules/types.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
import { ServiceBase } from './internal/serviceBase.js';
import { ServiceClientBase } from './internal/serviceClientBase.js';
import type {
  ActionsClientOf,
  ActionsOfWithFallback,
  EventsOfWithFallback,
  StateArgs,
  StateOfWithFallback,
} from './internal/types.js';
import type { ServiceDescriptor } from './types.js';

//-------------------------------------------------------
//-- helper types
//-------------------------------------------------------

type DepsFrom<T extends ModuleDescriptor | Module<any>> = T extends ModuleDescriptor
  ? T
  : T extends Module<infer D extends ModuleDescriptor>
    ? D
    : never;

type Providers<Descriptor extends ServiceDescriptor<any>> = {
  actions: ActionExecuter<ActionsOfWithFallback<Descriptor>>;
  state: ReactiveState<StateOfWithFallback<Descriptor>>;
  events: EventEmitter<EventsOfWithFallback<Descriptor>>;
};

//-------------------------------------------------------
//-- client
//-------------------------------------------------------

export class ServiceClient<Descriptor extends ServiceDescriptor<any>> extends ServiceClientBase<
  Providers<Descriptor>
> {
  readonly [_BRAND_SERVICE_CLIENT_] = true;
}

//-------------------------------------------------------
//-- service
//-------------------------------------------------------

export abstract class Service<
  Descriptor extends ServiceDescriptor<any>,
  Deps extends ModuleDescriptor | Module<any> = Empty,
> extends ServiceBase<Descriptor, Providers<Descriptor>, ServiceClient<Descriptor>> {
  readonly [_BRAND_SERVICE_] = true;

  [_DEPENDENCIES_]: ModuleClients<DepsFrom<Deps>> | undefined;

  /** shorthand for `this.actions.invoke` . i.e this.actions.invoke.foo() === this.invoke.foo()  */
  readonly invoke: ActionsClientOf<Providers<Descriptor>>;

  constructor(name: string | undefined, ...args: StateArgs<StateOfWithFallback<Descriptor>>) {
    const initialState = args[0] as StateOfWithFallback<Descriptor>;

    const actions = new ActionExecuter<ActionsOfWithFallback<Descriptor>>();
    const state = new ReactiveState<StateOfWithFallback<Descriptor>>(initialState);
    const events = new EventEmitter<EventsOfWithFallback<Descriptor>>();

    const client = new ServiceClient<Descriptor>(
      name, //
      actions.invoke,
      state.client,
      events.client,
    );

    super(name, actions, state, events, client);

    this.actions.setHandler(this as any as ActionsOfWithFallback<Descriptor>);
    this.invoke = this.actions.invoke;
  }

  protected getModule(): ModuleClients<DepsFrom<Deps>> {
    const deps = this[_DEPENDENCIES_];
    if (deps == null) {
      throw new Error(
        `[${this.name}]:getModule() - dependencies are not available.` +
          `They are only available from onServiceStart() and until onServiceBeforeStop()`,
      );
    }
    return deps;
  }
}

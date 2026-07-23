import { ActionExecuter } from '../actions/actionExecuter.js';
import { _BRAND_SERVICE_, _DEPENDENCIES_ } from '../core/symbols.js';
import type { Empty } from '../core/types.js';
import { EventEmitter } from '../events/eventEmitter.js';
import type { Module } from '../modules/module.js';
import type { ModuleClients, ModuleDescriptor } from '../modules/types.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
import { ServiceBase } from './internal/serviceBase.js';
import type {
  ActionsOfWithFallback,
  EventsOfWithFallback,
  StateArgs,
  StateOfWithFallback,
} from './internal/types.js';
import type { ServiceDescriptor } from './types.js';

type DepsFrom<T extends ModuleDescriptor | Module<any>> = T extends ModuleDescriptor
  ? T
  : T extends Module<infer D extends ModuleDescriptor>
    ? D
    : never;

export abstract class Service<
  Descriptor extends ServiceDescriptor<any>,
  Deps extends ModuleDescriptor | Module<any> = Empty,
> extends ServiceBase<
  Descriptor,
  {
    actions: ActionExecuter<ActionsOfWithFallback<Descriptor>>;
    state: ReactiveState<StateOfWithFallback<Descriptor>>;
    events: EventEmitter<EventsOfWithFallback<Descriptor>>;
  }
> {
  readonly [_BRAND_SERVICE_] = true;

  [_DEPENDENCIES_]: ModuleClients<DepsFrom<Deps>> | undefined;

  constructor(name: string | undefined, ...args: StateArgs<StateOfWithFallback<Descriptor>>) {
    const initialState = args[0] as StateOfWithFallback<Descriptor>;

    super(
      name,
      new ActionExecuter<ActionsOfWithFallback<Descriptor>>(),
      new ReactiveState<StateOfWithFallback<Descriptor>>(initialState),
      new EventEmitter<EventsOfWithFallback<Descriptor>>(),
    );

    this.actions.setHandler(this as any as ActionsOfWithFallback<Descriptor>);
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

import { ActionExecuter } from '../actions/actionExecuter.js';
import { _BRAND_REMOTE_SERVICE_ } from '../core/symbols.js';
import { EventEmitter } from '../events/eventEmitter.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
import { ServiceBase } from './internal/serviceBase.js';
import type {
  ActionsOfWithFallback,
  EventsOfWithFallback,
  StateArgs,
  StateOfWithFallback,
} from './internal/types.js';
import type { ServiceDescriptor } from './types.js';

export abstract class RemoteService<Descriptor extends ServiceDescriptor<any>> extends ServiceBase<
  Descriptor,
  {
    actions: ActionExecuter<ActionsOfWithFallback<Descriptor>>;
    state: ReactiveState<StateOfWithFallback<Descriptor>>;
    events: EventEmitter<EventsOfWithFallback<Descriptor>>;
  }
> {
  readonly [_BRAND_REMOTE_SERVICE_] = true;

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
}

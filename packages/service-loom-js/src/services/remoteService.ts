import { ActionExecuter } from '../actions/actionExecuter.js';
import { _BRAND_REMOTE_SERVICE_ } from '../core/symbols.js';
import { EventEmitter } from '../events/eventEmitter.js';
import { ReactiveState } from '../reactiveState/reactiveState.js';
import { ServiceBase } from './internal/serviceBase.js';
import type { ActionsOf, EventsOf, StateArgs, StateOf } from './internal/types.js';
import type { ServiceDescriptor } from './types.js';

export abstract class RemoteService<Descriptor extends ServiceDescriptor<any>> extends ServiceBase<
  Descriptor,
  {
    // uniform actualization: each provider coerces its own opted-out (undefined)
    // domain to an empty map internally, so no OrEmpty is needed here.
    actions: ActionExecuter<ActionsOf<Descriptor>>;
    state: ReactiveState<StateOf<Descriptor>>;
    events: EventEmitter<EventsOf<Descriptor>>;
  }
> {
  readonly [_BRAND_REMOTE_SERVICE_] = true;

  constructor(...args: StateArgs<StateOf<Descriptor>>) {
    const initialState = args[0] as StateOf<Descriptor>;
    const actions = new ActionExecuter<ActionsOf<Descriptor>>();

    super(actions, new ReactiveState(initialState), new EventEmitter());

    actions.setHandler(this as any as ActionsOf<Descriptor>);
  }
}

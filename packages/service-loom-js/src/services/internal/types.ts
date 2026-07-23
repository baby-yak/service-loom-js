import type { ActionMap } from '../../actions/types.js';
import type { _DESCRIPTOR_, _SHAPE_ } from '../../core/symbols.js';
import type { Provider } from '../../core/types.js';
import type { EventMap } from '../../events/types.js';
import type { StateMap } from '../../state/types.js';
import type { ServiceDescriptor } from '../types.js';
import type { ServiceBase } from './serviceBase.js';

export type ServiceShape = {
  actions?: ActionMap;
  state?: StateMap;
  events?: EventMap;
};

export type ServiceProvidersShape<
  ActionsP extends Provider,
  StateP extends Provider,
  EventsP extends Provider,
> = {
  readonly actions: ActionsP;
  readonly state: StateP;
  readonly events: EventsP;
};

//-------------------------------------------------------
//-- util types
//-------------------------------------------------------

// recover a service's Descriptor from the ServiceBase brand (directly inferable)

export type DescriptorOf<T extends ServiceBase<any, any>> = NonNullable<T[typeof _DESCRIPTOR_]>;

//-- descriptor / shape parts:

export type ShapeOf<T extends ServiceDescriptor<any>> = T[typeof _SHAPE_];

export type ActionsOf<T extends ServiceDescriptor<any>> =
  T extends ServiceDescriptor<infer Shape extends ServiceShape>
    ? Shape['actions'] //
    : never;

export type StateOf<T extends ServiceDescriptor<any>> =
  T extends ServiceDescriptor<infer Shape extends ServiceShape>
    ? Shape['state'] //
    : never;

export type EventsOf<T extends ServiceDescriptor<any>> =
  T extends ServiceDescriptor<infer Shape extends ServiceShape>
    ? Shape['events'] //
    : never;

//-- providers:

export type ActionsProviderOf<D extends ServiceProvidersShape<any, any, any>> =
  D extends ServiceProvidersShape<infer A, any, any> ? A : never;
export type StateProviderOf<D extends ServiceProvidersShape<any, any, any>> =
  D extends ServiceProvidersShape<any, infer S, any> ? S : never;
export type EventsProviderOf<D extends ServiceProvidersShape<any, any, any>> =
  D extends ServiceProvidersShape<any, any, infer E> ? E : never;

// constructor args: initial state is required, but OPTIONAL when State is undefined
export type StateArgs<S> = undefined extends S ? [initialState?: S] : [initialState: S];

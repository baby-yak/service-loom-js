import type { ActionMap } from '../../actions/types.js';
import type { _DESCRIPTOR_, _SHAPE_ } from '../../core/symbols.js';
import type { Empty, IsAny, Provider } from '../../core/types.js';
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
    ? Shape extends { actions: infer A extends ActionMap }
      ? A
      : undefined
    : never;

export type StateOf<T extends ServiceDescriptor<any>> =
  T extends ServiceDescriptor<infer Shape extends ServiceShape>
    ? Shape extends { state: infer S }
      ? S
      : undefined
    : never;

export type EventsOf<T extends ServiceDescriptor<any>> =
  T extends ServiceDescriptor<infer Shape extends ServiceShape>
    ? Shape extends { events: infer E extends EventMap }
      ? E
      : undefined
    : never;

// and with defaults where apply
// undefined actions => {}
// undefined state => undefined
// undefined events => {}
export type ActionsOfWithFallback<T extends ServiceDescriptor<any>> =
  IsAny<T> extends true
    ? any // ← Service<any> -> ActionExecuter<any> -> Map<any,any>
    : T extends ServiceDescriptor<infer Shape extends ServiceShape>
      ? Shape extends { actions: infer A extends ActionMap }
        ? A
        : Empty // <--
      : Empty; // <--

export type StateOfWithFallback<T extends ServiceDescriptor<any>> =
  IsAny<T> extends true
    ? any // ← Service<any> → State<any> → Map<any,any>
    : T extends ServiceDescriptor<infer Shape extends ServiceShape>
      ? Shape extends { state: infer S }
        ? S
        : undefined // <--
      : undefined; // <<--

export type EventsOfWithFallback<T extends ServiceDescriptor<any>> =
  IsAny<T> extends true
    ? any // ← Service<any> → Events<any> → Map<any,any>
    : T extends ServiceDescriptor<infer Shape extends ServiceShape>
      ? Shape extends { events: infer E extends EventMap }
        ? E
        : Empty // <--
      : Empty; // <--

//-- providers:

export type ActionsProviderOf<D extends ServiceProvidersShape<any, any, any>> =
  D extends ServiceProvidersShape<infer A, any, any> ? A : never;
export type StateProviderOf<D extends ServiceProvidersShape<any, any, any>> =
  D extends ServiceProvidersShape<any, infer S, any> ? S : never;
export type EventsProviderOf<D extends ServiceProvidersShape<any, any, any>> =
  D extends ServiceProvidersShape<any, any, infer E> ? E : never;

// constructor args: initial state is required, but OPTIONAL when State is undefined
export type StateArgs<S> = undefined extends S ? [initialState?: S] : [initialState: S];

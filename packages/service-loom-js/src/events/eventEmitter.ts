import type { EventClient } from './eventClient.js';
import { EventClient_imp } from './internal/eventClient_imp.js';
import {
  type EventNames_Pure,
  type EventNames_Reserved,
  type EventParams_Pure,
  type EventParams_Reserved,
  type GroupToken,
  isReservedEventName,
} from './internal/types.js';
import type {
  EventListener,
  EventListenersErrorHandlingType,
  EventMap,
  EventNames,
  EventParams,
} from './types.js';

export type EventEmitterParams = {
  /** per event. \
   * default is 10 */
  maxListeners?: number;

  /** how to handle when a listener throws an error \
   * default is "warn" */
  listenersErrorHandling?: EventListenersErrorHandlingType;
};

/**
 * container: { listener + metadata}
 */
type Listener<T_EventMap extends EventMap = EventMap> = {
  groupToken: GroupToken;
  listener: EventListener<T_EventMap, EventNames<T_EventMap>>;
  postRemoved?: ((event: EventNames<T_EventMap>) => void) | undefined;
  once: boolean;
};

/**
 * A fully typed event emitter. Pass your event map as the type parameter to get
 * compile-time safety on event names and listener signatures.
 *
 * @example
 * ```ts
 * type AppEvents = {
 *   userJoined: (userId: string) => void;
 *   scoreChanged: (userId: string, score: number) => void;
 * };
 *
 * const emitter = new EventEmitter<AppEvents>();
 * emitter.on('userJoined', (id) => console.log(id));
 * emitter.emit('userJoined', 'alice');
 * ```
 */
export class EventEmitter<T_EventMap extends EventMap = EventMap>
  extends EventClient_imp<T_EventMap>
  implements EventClient<T_EventMap>
{
  //instance marker

  private static _GLOBAL_MAX_LISTENERS = 10;

  private _listeners: Map<string, Array<Listener<T_EventMap>>>;
  private _defaultHandlers: Map<string, EventListener<T_EventMap, EventNames<T_EventMap>>>;
  private _options: Required<EventEmitterParams>;

  /**
   * Returns a read-only view of this emitter — same listen API, no `emit`.
   * Use `createListenerGroup()` on the returned client (or on this emitter)
   * to get a group that can be bulk-removed later.
   */
  readonly client: EventClient<T_EventMap>;

  /** Default max listeners for all new instances. Set to `0` or `Infinity` to disable. */
  static set defaultMaxListeners(value: number) {
    this._GLOBAL_MAX_LISTENERS = value;
  }
  static get defaultMaxListeners() {
    return this._GLOBAL_MAX_LISTENERS;
  }

  /** Sets the max listener threshold for this instance. Returns `this` for chaining. */
  setMaxListeners(n: number) {
    this._options.maxListeners = n;
    return this;
  }

  /** Returns the current max listener threshold for this instance. */
  getMaxListeners() {
    return this._options.maxListeners;
  }

  //-------------------------------------------------------
  constructor(params?: EventEmitterParams) {
    // root group , and undefined as source - abstract methods are self implemented (see _addListener and _removeListener)
    super({ name: 'root' }, undefined);

    this.client = new EventClient_imp({ name: 'client group' }, this);

    this._listeners = new Map();
    this._defaultHandlers = new Map();
    this._options = {
      ...{
        maxListeners: EventEmitter._GLOBAL_MAX_LISTENERS,
        listenersErrorHandling: 'warn',
      },
      ...params,
    };
    this._options.maxListeners = params?.maxListeners ?? EventEmitter.defaultMaxListeners;
    this._options.listenersErrorHandling = params?.listenersErrorHandling ?? 'warn';
  }
  //-------------------------------------------------------

  /**
   * Sets how listener exceptions are handled. Returns `this` for chaining.
   *
   * - `'warn'` — `console.warn` (default)
   * - `'log'` — `console.log`
   * - `'error'` — `console.error`
   * - `'ignore'` — swallow silently
   * - `'throw'` — rethrow; remaining listeners are not called
   * - `(event, err) => void` — custom handler
   */
  setListenersErrorHandling(e: EventListenersErrorHandlingType) {
    this._options.listenersErrorHandling = e;
    return this;
  }

  /** Returns the current error handling mode. */
  getListenersErrorHandling() {
    return this._options.listenersErrorHandling;
  }

  /**
   * Emits an event, calling all registered listeners in order.
   * Returns `true` if at least one listener was called, `false` otherwise.
   *
   * Only user-defined events can be emitted — internal events (`newListener`,
   * `removeListener`) are fired automatically by the emitter.
   */
  emit<T_Event extends EventNames_Pure<T_EventMap>>(
    event: T_Event,
    ...args: EventParams_Pure<T_EventMap, T_Event>
  ): boolean {
    return this._emit({
      event,
      args,
      emitWildcardEvent: true,
    });
  }

  //-------------------------------------------------------
  //-- DEFAULT HANDLERS
  //-------------------------------------------------------
  /**
   * Sets a fallback handler for an event that fires only when no regular listeners are registered.
   * The default handler is not counted by `listenerCount()` and does not prevent `emit()` from
   * returning `false`.
   *
   * Pass `undefined` to remove a previously set default handler.
   *
   * @example
   * emitter.setDefaultHandler('error', (err) => console.error('unhandled error:', err));
   * emitter.emit('error', new Error('oops')); // → default handler fires
   * emitter.on('error', myHandler);
   * emitter.emit('error', new Error('oops')); // → myHandler fires, default does not
   */
  setDefaultHandler<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event> | undefined,
  ): this {
    if (listener) {
      this._defaultHandlers.set(
        event,
        listener as EventListener<T_EventMap, EventNames<T_EventMap>>,
      );
    } else {
      this._defaultHandlers.delete(event);
    }

    return this;
  }

  /**
   * Removes all listeners for a specific event, or all listeners for all events
   * if no event is specified. Returns `this` for chaining.
   */
  removeAllListeners(event?: EventNames<T_EventMap>): this {
    if (event) {
      const listeners = this.listeners(event);
      for (const listener of listeners) {
        this._removeListener({
          event,
          listener,
        });
      }
    } else {
      //resource
      const events = [...this._listeners.keys()];
      for (const event of events) {
        this.removeAllListeners(event);
      }
    }
    return this;
  }

  /** Returns the number of listeners registered for the given event. */
  listenerCount(event?: EventNames<T_EventMap>): number {
    if (event) {
      return this._listeners.get(event)?.length ?? 0;
    } else {
      const all = [...this._listeners.values()];
      const count = all.reduce((prev, curr) => prev + curr.length, 0);
      return count;
    }
  }

  /** Returns an array of event names that currently have at least one listener. */
  eventNames() {
    const all = [...this._listeners.keys()];
    const withoutWildcard = all.filter((x) => x !== '*');
    return withoutWildcard;
  }

  /**
   * Returns the wrapped listener functions for the given event — these include
   * the auto-remove logic injected by `once()` and `prependOnceListener()`.
   * Use `rawListeners()` to get the original functions.
   */
  listeners<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
  ): EventListener<T_EventMap, T_Event>[] {
    const listeners = this._listeners.get(event) || [];
    return listeners.map((x) => x.listener) as EventListener<T_EventMap, T_Event>[];
  }

  /** Returns the original listener functions, without any once-wrapper logic. */
  rawListeners<T_Event extends EventNames<T_EventMap>>(event: T_Event) {
    const listeners = this._listeners.get(event) || [];
    return listeners.map((x) => x.listener) as EventListener<T_EventMap, T_Event>[];
  }

  // for internal library use
  protected override _detachGroup(
    event: EventNames<T_EventMap> | undefined,
    groupToken: GroupToken,
  ): void {
    if (event != null) {
      const existing = this._listeners.get(event) ?? [];
      const fromSource = existing.filter((x) => x.groupToken === groupToken);
      for (const container of fromSource) {
        const listener = container.listener;

        this._removeListener({
          event,
          listener,
        });
      }
    } else {
      //resource for all events
      const events = [...this._listeners.keys()];
      events.forEach((event) => {
        this._detachGroup(event, groupToken);
      });
    }
  }

  //-------------------------------------------------------
  //-- utilities
  //-------------------------------------------------------

  private _handleListenerException(event: EventNames<T_EventMap>, err: unknown) {
    let shouldThrow = false;

    try {
      if (typeof this._options.listenersErrorHandling === 'function') {
        this._options.listenersErrorHandling(event, err);
      } else if (this._options.listenersErrorHandling === 'throw') {
        shouldThrow = true;
      } else {
        const msg = `[EventEmitter] listener error on "${event}":`;
        switch (this._options.listenersErrorHandling) {
          case 'ignore':
            break;
          case 'log':
            console.log(msg, err);
            break;
          case 'warn':
            console.warn(msg, err);
            break;
          case 'error':
            console.error(msg, err);
            break;

          default:
            break;
        }
      }
    } catch {
      // this is enough!
    }

    // decided to rethrow !
    if (shouldThrow) {
      throw err;
    }
  }

  /** Allows only internal events. */
  private _emitInternal<Event extends EventNames_Reserved>(
    event: Event,
    ...args: EventParams_Reserved<T_EventMap, Event>
  ) {
    return this._emit({
      event,
      args,
      emitWildcardEvent: false,
    });
  }

  /** allows also internal events ("newListener", "removeListener", etc) */
  private _emit<T_Event extends EventNames<T_EventMap>>(params: {
    event: T_Event;
    args: EventParams<T_EventMap, T_Event>;
    emitWildcardEvent: boolean;
  }): boolean {
    const { event, args, emitWildcardEvent } = params;

    if (event === '*') {
      throw Error(
        `emitting wildcard event ("*") in not allowed. it's automatically sent to listeners on all user events`,
      );
    }

    //fire all wildcard ("*") listeners
    if (emitWildcardEvent) {
      // snapshot before iterating so mid-dispatch mutations don't affect this pass
      const containers = [...(this._listeners.get('*') || [])];

      // no listeners -  fire default:
      if (containers.length === 0) {
        const defaultHandler = this._defaultHandlers.get('*');
        if (defaultHandler) {
          containers.push({
            groupToken: { name: 'default' },
            listener: defaultHandler,
            once: false,
          });
        }
      }
      // fire all listeners
      for (const container of containers) {
        const { listener, once } = container;
        try {
          listener(event, ...args);

          //remove if "once"
          if (once) {
            this._removeListener({
              event: '*',
              listener: listener as EventListener<T_EventMap, '*'>,
            });
          }
        } catch (err) {
          this._handleListenerException('*', err);
        }
      }
    }

    //now the actual listeners
    // snapshot before iterating so mid-dispatch mutations don't affect this pass
    const containers = [...(this._listeners.get(event) || [])];

    // no listeners -  fire default:
    const hasListeners = containers.length > 0;

    if (containers.length === 0) {
      const defaultHandler = this._defaultHandlers.get(event);
      if (defaultHandler) {
        containers.push({
          groupToken: { name: 'default' },
          listener: defaultHandler,
          once: false,
        });
      }
    }

    for (const container of containers) {
      const { listener, once } = container;
      try {
        listener(...args);
        //remove if "once"
        if (once) {
          this._removeListener({
            event: event,
            listener: listener as EventListener<T_EventMap, T_Event>,
          });
        }
      } catch (err) {
        this._handleListenerException(event, err);
      }
    }

    return hasListeners;
  }

  //-------------------------------------------------------
  // implement abstract
  protected override _addListener<T_Event extends EventNames<T_EventMap>>(params: {
    groupToken: GroupToken;
    event: T_Event;
    listener: EventListener<T_EventMap, T_Event>;
    postRemoved?: (event: EventNames<T_EventMap>) => void;
    once?: boolean;
    prepend?: boolean;
  }): this {
    const { event, listener, postRemoved, groupToken, once = false, prepend = false } = params;

    //fire (internal event)
    if (!isReservedEventName(event)) {
      this._emitInternal('newListener', event, listener);
    }

    //get or create list
    let listeners = this._listeners.get(event) ?? [];

    //add
    const container: Listener<T_EventMap> = {
      groupToken: groupToken,
      listener: listener as EventListener<T_EventMap, EventNames<T_EventMap>>,
      postRemoved: postRemoved,
      once: once,
    };

    if (prepend) {
      listeners = [container, ...listeners];
    } else {
      listeners = [...listeners, container];
    }
    this._listeners.set(event, listeners);

    const ignoreLimit = this._options.maxListeners === 0 || this._options.maxListeners === Infinity;
    if (!ignoreLimit && listeners.length > this._options.maxListeners) {
      console.warn(
        `MaxListenersExceededWarning: Possible EventEmitter memory leak detected.\n${listeners.length} ${event} listeners added to [EventEmitter]. Use setMaxListeners() to increase limit`,
      );
    }
    return this;
  }
  //-------------------------------------------------------
  // implement abstract
  protected override _removeListener<T_Event extends EventNames<T_EventMap>>(params: {
    event: T_Event;
    listener: EventListener<T_EventMap, T_Event>;
  }): this {
    const { event, listener /* ,groupToken */ } = params;

    const containers = this._listeners.get(event) ?? [];
    // first match goes
    // match against either the raw (for normal remove) or the wrapped (on once() remove with a wrapped listener)
    const idx = containers.findIndex((x) => x.listener === listener);
    if (idx !== -1) {
      const container = containers[idx];
      const postRemoved = container?.postRemoved;

      // splice is in place. no need to update the ref.
      containers.splice(idx, 1);

      //call postRemoved callback if exists
      postRemoved?.(event);

      //fire (internal event)
      if (!isReservedEventName(event)) {
        this._emitInternal('removeListener', event, listener);
      }
    }
    //prune if empty
    if (containers.length === 0) {
      this._listeners.delete(event);
    }
    return this;
  }
}

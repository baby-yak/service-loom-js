import type {
  EventGroupContext,
  EventListener,
  EventMap,
  EventNames,
  EventParams,
} from './types.js';

export interface EventClient<T_EventMap extends EventMap = EventMap> {
  /**
   * Adds a listener and returns an unsubscribe function.
   * Calling the returned function removes the listener.
   *
   * @example
   * ```ts
   * const unsub = emitter.subscribe('click', handler);
   * unsub(); // removes the listener
   * ```
   */
  subscribe<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): () => void;

  /**
   * Adds a listener for the given event. The same function can be added multiple
   * times and will be called once per registration. Returns `this` for chaining.
   */
  on<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this;

  /**
   * Adds a one-time listener. It is automatically removed after the first time
   * the event is emitted. Returns `this` for chaining.
   */
  once<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this;

  /**
   * Adds a one-time listener. It is automatically removed after the first time
   * Calling the returned function removes the listener.
   * (whichever happens first )
   */
  subscribeOnce<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): () => void;

  /** Alias for `on()`. */
  addListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this;

  /**
   * Adds a listener at the front of the call queue so it is called before
   * any previously registered listeners. Returns `this` for chaining.
   */
  prependListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this;

  /** Like `prependListener`, but auto-removes after the first emit. */
  prependOnceListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this;

  /**
   * Returns a `Promise` that resolves with the event's arguments the next time
   * the event fires, then auto-removes the listener.
   *
   * Pass an `AbortSignal` to cancel the wait — the promise will reject with an
   * `Error('aborted')`. If the signal is already aborted when `waitFor` is
   * called, the promise rejects immediately.
   *
   * @example
   * ```ts
   * // basic
   * const [userId] = await emitter.waitFor('userJoined');
   *
   * // with timeout (Node ≥ 18)
   * const [userId] = await emitter.waitFor('userJoined', {
   *   signal: AbortSignal.timeout(5000),
   * });
   * ```
   */
  waitFor<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    options?: { signal?: AbortSignal },
  ): Promise<EventParams<T_EventMap, T_Event>>;

  /**
   * Removes the first matching registration of `listener` for `event`.
   * If the same function was registered multiple times, only the first is removed.
   * Returns `this` for chaining.
   */
  off<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this;

  /** Alias for `off()`. */
  removeListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this;

  /**
   * Creates a named listener group — a `{ client, detachGroup }` pair.
   *
   * Register listeners through `client` (same API as any `EventClient`).
   * Call `detachGroup()` to bulk-remove every listener registered through
   * that `client` in one shot. Pass an event name to limit removal to a
   * single event.
   *
   * Groups created from a child client are still scoped to the root emitter,
   * so detaching them removes the listeners from the shared listener store.
   *
   * @example
   * ```ts
   * const group = emitter.createListenerGroup('my-component');
   *
   * group.client.on('userJoined', onUserJoined);
   * group.client.on('scoreChanged', onScoreChanged);
   *
   * // later — removes all listeners registered through this group
   * group.detachGroup();
   *
   * // or limit removal to one event
   * group.detachGroup('userJoined');
   * ```
   *
   * @param name Optional label used for debugging. Does not affect uniqueness.
   */
  createListenerGroup(name?: string): EventGroupContext<T_EventMap>;
}

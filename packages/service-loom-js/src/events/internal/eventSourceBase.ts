import type { EventSource } from '../eventSource.js';
import type { EventListener, EventMap, EventNames, EventParams } from '../types.js';

export abstract class EventSourceBase<
  T_EventMap extends EventMap,
> implements EventSource<T_EventMap> {
  // the root will be
  protected readonly root: EventSourceBase<T_EventMap> | undefined;

  constructor(root: EventSourceBase<T_EventMap> | undefined) {
    this.root = root;
  }

  //-------------------------------------------------------
  //-- optional abstract - MUST BE IMPLEMENTS BY ROOT IMPLEMENTOR
  //-------------------------------------------------------

  protected _addListener<T_Event extends EventNames<T_EventMap>>(params: {
    event: T_Event;
    listener: EventListener<T_EventMap, T_Event>;
    postRemoved?: (event: EventNames<T_EventMap>) => void;
    once?: boolean;
    prepend?: boolean;
  }) {
    if (this.root == null) {
      throw new Error('[_addListener] not implemented. this method must be overridden !');
    }
    this.root._addListener(params);
  }

  protected _removeListener<T_Event extends EventNames<T_EventMap>>(params: {
    event: T_Event;
    listener: EventListener<T_EventMap, T_Event>;
  }) {
    if (this.root == null) {
      throw new Error('[_removeListener] not implemented. this method must be overridden !');
    }
    this.root._removeListener(params);
  }

  //-------------------------------------------------------
  //-- implement interface with the abstract methods
  //-------------------------------------------------------

  subscribe<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): () => void {
    const remove = () => this._removeListener({ event, listener });
    this._addListener({ event, listener });
    return remove;
  }

  on<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ event, listener });
    return this;
  }

  once<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ event, listener, once: true });
    return this;
  }

  subscribeOnce<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): () => void {
    this._addListener({ event, listener, once: true });
    return () => this._removeListener({ event, listener });
  }

  addListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ event, listener });
    return this;
  }

  prependListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ event, listener, prepend: true });
    return this;
  }

  prependOnceListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({
      event,
      listener,
      once: true,
      prepend: true,
    });
    return this;
  }

  waitFor<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    options?: { signal?: AbortSignal },
  ): Promise<EventParams<T_EventMap, T_Event>> {
    return new Promise((resolve, reject) => {
      const signal = options?.signal;
      let handled = false;

      // premature abortion
      if (signal?.aborted) {
        handled = true;
        reject(new Error('aborted'));
        return;
      }

      // handle bort
      const onAbort = () => {
        handled = true;
        this._removeListener({ event, listener });
        reject(new Error('aborted'));
      };
      signal?.addEventListener('abort', onAbort, { once: true });

      // register event (once)
      const listener = ((...args: EventParams<T_EventMap, T_Event>) => {
        handled = true;
        signal?.removeEventListener('abort', onAbort);
        resolve(args);
      }) as EventListener<T_EventMap, T_Event>;

      const postRemoved = () => {
        if (handled) return;
        reject(new Error('removed'));
      };

      ///subscribe
      this._addListener({
        event,
        listener,
        once: true,
        postRemoved: postRemoved,
      });
    });
  }

  off<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._removeListener({ event, listener });
    return this;
  }

  removeListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._removeListener({ event, listener });
    return this;
  }
}

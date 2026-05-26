import type { EventClient } from '../eventClient.js';
import type {
  EventGroupContext,
  EventListener,
  EventMap,
  EventNames,
  EventParams,
} from '../types.js';
import type { GroupToken } from './types.js';

let GROUP_COUNT = 0;

export class EventClient_imp<
  T_EventMap extends EventMap = EventMap,
> implements EventClient<T_EventMap> {
  // the root will be
  protected readonly root: EventClient_imp<T_EventMap> | undefined;

  /** unique to this client (later all listeners from this client can be removed at once) */
  protected readonly groupToken: GroupToken;

  /**
   *
   * @param groupToken a unique group token (name is just a nicety not related to uniqueness, the object instance is unique)
   */
  constructor(groupToken: GroupToken, root: EventClient_imp<T_EventMap> | undefined) {
    if (root === this) {
      throw new Error('[EventClientBase] root cannot be === this');
    }

    this.groupToken = groupToken;
    this.root = root;
  }

  //-------------------------------------------------------
  //-- optional abstract - MUST BE IMPLEMENTS BY ROOT IMPLEMENTOR
  //-------------------------------------------------------

  protected _addListener<T_Event extends EventNames<T_EventMap>>(params: {
    groupToken: GroupToken;
    event: T_Event;
    listener: EventListener<T_EventMap, T_Event>;
    postRemoved?: (event: EventNames<T_EventMap>) => void;
    once?: boolean;
    prepend?: boolean;
  }) {
    if (this.root === this) {
      throw new Error('[_addListener] circular function call!');
    }
    if (this.root == null) {
      throw new Error('[_addListener] not implemented. this method must be overridden !');
    }
    this.root._addListener(params);
  }

  protected _removeListener<T_Event extends EventNames<T_EventMap>>(params: {
    event: T_Event;
    listener: EventListener<T_EventMap, T_Event>;
  }) {
    if (this.root === this) {
      throw new Error('[_removeListener] circular function call!');
    }
    if (this.root == null) {
      throw new Error('[_removeListener] not implemented. this method must be overridden !');
    }
    this.root._removeListener(params);
  }

  protected _detachGroup(event: EventNames<T_EventMap> | undefined, groupToken: GroupToken) {
    if (this.root === this) {
      throw new Error('[_detachGroup] circular function call!');
    }
    if (this.root == null) {
      throw new Error('[_detachGroup] not implemented. this method must be overridden !');
    }
    this.root._detachGroup(event, groupToken);
  }
  //-------------------------------------------------------
  //-- access to library elements
  //-------------------------------------------------------

  createListenerGroup(name?: string): EventGroupContext<T_EventMap> {
    const token: GroupToken = { name: '' };
    if (name == null) {
      GROUP_COUNT++;
      token.name = `group ${GROUP_COUNT}`;
    } else {
      token.name = name;
    }

    // root emitter.
    // for the original emitter this will be undefined (it is the root)
    // for dependent clients - this will be the root emitter.
    const root = this.root ?? this;

    return {
      client: new EventClient_imp(token, root),
      detachGroup: (event) => this._detachGroup(event, token),
    };
  }

  //-------------------------------------------------------
  //-- implement interface with the abstract methods
  //-------------------------------------------------------

  subscribe<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): () => void {
    const remove = () => this._removeListener({ event, listener });
    this._addListener({ event, listener, groupToken: this.groupToken });
    return remove;
  }

  on<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ groupToken: this.groupToken, event, listener });
    return this;
  }

  once<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ groupToken: this.groupToken, event, listener, once: true });
    return this;
  }

  subscribeOnce<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): () => void {
    this._addListener({ groupToken: this.groupToken, event, listener, once: true });
    return () => this._removeListener({ event, listener });
  }

  addListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ groupToken: this.groupToken, event, listener });
    return this;
  }

  prependListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({ groupToken: this.groupToken, event, listener, prepend: true });
    return this;
  }

  prependOnceListener<T_Event extends EventNames<T_EventMap>>(
    event: T_Event,
    listener: EventListener<T_EventMap, T_Event>,
  ): this {
    this._addListener({
      groupToken: this.groupToken,
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
        groupToken: this.groupToken,
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

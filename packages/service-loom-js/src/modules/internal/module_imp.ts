import type { UnsubscribeFn } from '../../core/types.js';
import { EventEmitter } from '../../events/eventEmitter.js';
import type { EventClient } from '../../events/index.js';
import type { ReactiveStateClient } from '../../reactiveState/index.js';
import { ReactiveState } from '../../reactiveState/reactiveState.js';
import { _SERVICE_LIFECYCLE_ } from '../../services/internal/types.js';
import type { Service } from '../../services/service.js';
import { createDebugLogger } from '../../utils/debugLogger.js';
import { AsyncMutex } from '../../utils/mutex.js';
import type { Module } from '../module.js';
import type { ModuleClient } from '../moduleClient.js';
import type {
  ModuleDescriptor,
  ModuleEvents,
  ModuleParams,
  ModuleServiceClients,
  ModuleState,
} from '../types.js';
import { ModuleClient_imp } from './moduleClient_imp.js';

export class Module_Imp<M extends ModuleDescriptor> implements Module<M> {
  private params: Required<ModuleParams>;
  private servicesImplementors: M;

  private longestServiceName = 0;
  private _lock = new AsyncMutex();

  private _debugLogger: Console;

  readonly name: string;

  /**
   * Typed client facades for each service, keyed by the same names as the constructor input.
   * Use these to interact with services from outside the module.
   */
  readonly services: ModuleServiceClients<M>;

  readonly client: ModuleClient<M>;

  private _state: ReactiveState<ModuleState>;
  private _events: EventEmitter<ModuleEvents>;

  readonly state: ReactiveStateClient<ModuleState>;
  readonly events: EventClient<ModuleEvents>;

  constructor(services: M, params?: ModuleParams) {
    this.params = {
      ...{
        name: 'untitled',
        verbose: false,
      },
      ...params,
    };

    this.name = params?.name ?? 'untitled';

    this._debugLogger = createDebugLogger(this.params.verbose);

    this.servicesImplementors = services;
    this._state = new ReactiveState<ModuleState>({ isStarted: false });
    this._events = new EventEmitter<ModuleEvents>();

    // default module error listeners:
    this._events.setDefaultHandler('errorStarting', (err) =>
      console.error('[module] unhandled start error:', err),
    );
    this._events.setDefaultHandler('errorStopping', (err) =>
      console.error('[module] unhandled stop error:', err),
    );

    this.state = this._state.client;
    this.events = this._events.client;

    // services -> service clients
    const clientsEntries = Object.entries(services).map(([key, service]) => [key, service.client]);

    this.services = Object.fromEntries(clientsEntries) as ModuleServiceClients<M>;

    //calc longestServiceName
    this.longestServiceName = Object.values(this.servicesImplementors).reduce(
      (prev, x) => Math.max(prev, x.name.length),
      0,
    );

    //after self was created fully !
    this.client = new ModuleClient_imp(this);
  }

  /** Start all services in sequence: `onServiceInit` → `onServiceStart` → `onServiceAfterStart`. */
  start() {
    this._lock
      .doLocked(async () => {
        if (this._state.get().isStarted) {
          return;
        }
        this._debugLogger.log(`module initialization...`);
        await this.doAll(async (s) => s.onServiceInit(), 'init');
        await this.doAll((s) => {
          // set self as module in all services
          s[_SERVICE_LIFECYCLE_].setModule(this.client);
        }, undefined);
        await this.doAll(async (s) => s.onServiceStart(), 'start');
        await this.doAll(async (s) => s.onServiceAfterStart(), 'after-start');
      })
      .then(() => {
        this._debugLogger.log(`module initialization complete`);
        this._state.update({ isStarted: true });
        this._events.emit('started');
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error('error starting services');
        this._events.emit('errorStarting', error);
      });
  }

  /** Stop all services in sequence: `onServiceBeforeStop` → `onServiceStop`. */
  stop() {
    this._lock
      .doLocked(async () => {
        if (!this._state.get().isStarted) {
          return;
        }
        this._debugLogger.log(`module teardown...`);
        await this.doAll(async (s) => s.onServiceBeforeStop(), 'before-stop');
        await this.doAll(async (s) => s.onServiceStop(), 'stop');
      })
      .then(() => {
        this._debugLogger.log(`module teardown complete`);
        this._state.update({ isStarted: false });
        this._events.emit('stopped');
      })
      .catch((err: unknown) => {
        const error = err instanceof Error ? err : new Error('error stopping services');
        this._events.emit('errorStopping', error);
      });
  }

  waitForStart() {
    if (this.state.get().isStarted) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const subs: UnsubscribeFn[] = [];
      subs.push(
        this.events.subscribe('started', () => {
          resolve();
          subs.forEach((unsub) => unsub());
        }),
      );
      subs.push(
        this.events.subscribe('errorStarting', (err) => {
          reject(err);
          subs.forEach((unsub) => unsub());
        }),
      );
    });
  }

  /** resolves on 'stopped' (or immediately if already stopped), rejects on 'error' */
  waitForStop() {
    if (!this.state.get().isStarted) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve, reject) => {
      const subs: UnsubscribeFn[] = [];
      subs.push(
        this.events.subscribe('stopped', () => {
          resolve();
          subs.forEach((unsub) => unsub());
        }),
      );
      subs.push(
        this.events.subscribe('errorStopping', (err) => {
          reject(err);
          subs.forEach((unsub) => unsub());
        }),
      );
    });
  }

  //-------------------------------------------------------
  //-- HELPERS
  //-------------------------------------------------------

  private async doAll(
    fn: (service: Service<any>) => Promise<void> | void,
    verboseMessage: string | undefined,
  ) {
    const all = this.servicesImplementors;
    const promises: Promise<void>[] = [];

    for (const key in all) {
      if (!Object.hasOwn(all, key)) continue;
      const service = all[key] as Service<any>;

      promises.push(
        Promise.resolve(fn(service)).then(() => {
          if (verboseMessage != null) {
            const paddedName = service.name.padEnd(this.longestServiceName);
            this._debugLogger.log(` > service [ ${paddedName} ] : ${verboseMessage} complete`);
          }
        }),
      );
    }

    await Promise.all(promises);
  }
}

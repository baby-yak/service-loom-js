import { _DEPENDENCIES_ } from '../../core/symbols.js';
import type { ServiceBase } from '../../services/internal/serviceBase.js';
import type { ServiceDescriptor } from '../../services/types.js';
import { Service } from '../../services/service.js';
import { createDebugLogger } from '../../utils/debugLogger.js';
import { AsyncMutex } from '../../utils/mutex.js';
import type { Module } from '../module.js';
import type { ModuleClients, ModuleDescriptor, ModuleParams } from '../types.js';
import { getLongestName } from './utils.js';

export class Module_Imp<M extends ModuleDescriptor> implements Module<M> {
  readonly name: string;

  private _params: Required<ModuleParams>;
  private _servicesImplementors: M;

  private _isStarted = false;
  private _lock = new AsyncMutex();

  private _longestServiceName = 0;
  private _debugLogger: Console;

  /**
   * Typed client facades for each service, keyed by the same names as the constructor input.
   * Use these to interact with services from outside the module.
   */
  readonly services: ModuleClients<M>;

  //-------------------------------------------------------

  constructor(services: M, params?: ModuleParams) {
    this._params = {
      ...{
        name: 'untitled',
        verbose: false,
      },
      ...params,
    };
    this.name = this._params.name;
    this._servicesImplementors = services;

    this._debugLogger = createDebugLogger(this._params.verbose);

    // services -> service clients
    this.services = Object.fromEntries(
      Object.entries(services).map(([key, service]) => [key, service.client]),
    ) as ModuleClients<M>;
       
    //calc longestServiceName for logging padding
    this._longestServiceName = getLongestName(services);
  }

  //-------------------------------------------------------

  /** Start all services in sequence: `onServiceInit` → `onServiceStart` → `onServiceAfterStart`. */
  async start() {
    await this._lock.doLocked(async () => {
      if (this._isStarted) {
        return;
      }
      this._debugLogger.log(`module initialization...`);
      await this.runPhase('init', false, async (s) => s.onServiceInit());
      await this.runPhase('start', true, async (s) => s.onServiceStart());
      await this.runPhase('after-start', true, async (s) => s.onServiceAfterStart());
      this._isStarted = true;
      this._debugLogger.log(`module initialization complete`);
    });
  }

  //-------------------------------------------------------

  /** Stop all services in sequence: `onServiceBeforeStop` → `onServiceStop`. */
  async stop() {
    await this._lock.doLocked(async () => {
      if (!this._isStarted) {
        return;
      }
      this._debugLogger.log(`module teardown...`);
      await this.runPhase('before-stop', false, async (s) => s.onServiceBeforeStop());
      await this.runPhase('stop', true, async (s) => s.onServiceStop());
      this._isStarted = false;
      this._debugLogger.log(`module teardown complete`);
    });
  }

  //-------------------------------------------------------
  //-- HELPERS
  //-------------------------------------------------------

  private createDependenciesProxy(serviceName: string) {
    // proxy so a missing dep throws a friendly error instead of being undefined
    return new Proxy(this.services, {
      get(target, prop) {
        if (!(prop in target)) {
          throw new Error(
            `[${serviceName}]:getModule().${String(prop)} - dependency "${String(prop)}" is missing. ` +
              `Is it registered in the module?`,
          );
        }

        return (target as Record<PropertyKey, unknown>)[prop];
      },
    });
  }

  //-------------------------------------------------------

  private async runPhase(
    title: string,
    allowDependencies: boolean,
    fn: (s: ServiceBase<ServiceDescriptor<any>, any>) => void | Promise<void>,
  ): Promise<void> {
    console.log(`[module] running ${title} ...`);
    const all = this._servicesImplementors;
    // if (all == null) {
    //   return;
    // }

    await Promise.all(
      Object.entries(all).map(async ([key, svc]) => {
        const name = svc.name ?? key;

        // set / unset service injected dependencies
        if (svc instanceof Service) {
          svc[_DEPENDENCIES_] = allowDependencies ? this.createDependenciesProxy(name) : undefined;
        }

        // run phase (rejections propagate through Promise.all)
        await fn(svc);

        const paddedName = name.padEnd(this._longestServiceName);
        console.log(` ✅ [${paddedName}]`);
      }),
    );
  }
}

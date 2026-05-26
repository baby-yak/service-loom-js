import {
  createModule,
  type Module,
  type ModuleClient,
  type ModuleDescriptor,
  type ModuleParams,
} from "@baby-yak/service-loom-js";
import { createContext, useContext, useEffect, useRef } from "react";

export type ModuleProviderProps<M extends ModuleDescriptor> = {
  children?: React.ReactNode;
  /** Factory called once on mount to create the service instances for the module. */
  createModule: () => M;
};

/**
 * Creates a scoped React context for a module — returns a typed `ModuleProvider` and `useModule` pair.
 *
 * Call once per module type (typically at the module level). The returned `ModuleProvider`
 * accepts a `createModule` prop that is called once on mount to instantiate services.
 * The module lifecycle (`start` / `stop`) is managed automatically.
 *
 * `useModule()` returns a `ModuleClient` — a read-only facade with `services`, `state`, and `events`.
 * `start` and `stop` are not exposed to consumers.
 *
 * @param params optional module construction params (e.g. `verbose`)
 *
 * @example
 * type App = { counter: ICounter; server: IServer };
 * const { ModuleProvider, useModule } = createModuleContext<App>();
 *
 * // provide:
 * <ModuleProvider createModule={() => ({ counter: new CounterService(), server: new ServerService() })}>
 *   <App />
 * </ModuleProvider>
 *
 * // consume anywhere in the tree:
 * const { services, state, events } = useModule();
 * const { counter, server } = services;
 * const { isStarted } = state.get();
 */
export function createModuleContext<M extends ModuleDescriptor>(
  params?: ModuleParams,
) {
  const context = createContext<ModuleClient<any> | null>(null);

  //provider component
  const ModuleProvider = (props: ModuleProviderProps<M>) => {
    const moduleRef = useRef<
      | {
          module: Module<M>;
          moduleClient: ModuleClient<M>;
        }
      | undefined
    >(undefined);
    if (moduleRef.current == null) {
      // lazy create once
      const module = createModule(props.createModule(), params);
      const moduleClient = module.client;

      moduleRef.current = { module, moduleClient };
    }

    //start - stop
    useEffect(() => {
      moduleRef.current?.module.start();
      return () => {
        moduleRef.current?.module.stop();
      };
    }, []);

    //the provider
    return (
      <context.Provider value={moduleRef.current.moduleClient}>
        {props.children}
      </context.Provider>
    );
  };

  const useModule = (): ModuleClient<M> => {
    const res = useContext(context) as ModuleClient<M> | undefined;

    if (res == null) {
      // throw new Error('oops');
      throw new Error(
        "useModule was used without a matching Provider.\nDid you forget to use the <ModuleProvider> component in the tree?",
      );
    }
    return res;
  };

  return {
    ModuleProvider,
    useModule,
  };
}

//-------------------------------------------------------
//-------------------------------------------------------
//-------------------------------------------------------

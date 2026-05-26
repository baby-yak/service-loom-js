import {
  createModule,
  type Module,
  type ModuleParams,
  type RawService,
  type ServiceToClient,
} from "@baby-yak/service-loom-js";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

export type ServiceProviderProps<S extends RawService<any, any>> = {
  children?: ReactNode;
  /** Factory called once on mount to create the service instance. */
  createService: () => S;
};

/**
 * Creates a scoped React context for a single service — returns a typed `ServiceProvider` and `useService` pair.
 *
 * Call once per service type (typically at the module level). The returned `ServiceProvider`
 * accepts a `createService` prop that is called once on mount to instantiate the service.
 * The service lifecycle (`start` / `stop`) is managed automatically.
 *
 * @param params optional module construction params (e.g. `verbose`)
 *
 * @example
 * const { ServiceProvider, useService } = createServiceContext<CounterService>();
 *
 * // provide:
 * <ServiceProvider createService={() => new CounterService()}>
 *   <CounterView />
 * </ServiceProvider>
 *
 * // consume anywhere in the tree:
 * const counter = useService();
 * counter.actions.increment();
 */
export function createServiceContext<S extends RawService<any, any>>(
  params?: ModuleParams,
) {
  const context = createContext<ServiceToClient<S> | null>(null);

  const ServiceProvider = ({
    createService,
    children,
  }: ServiceProviderProps<S>) => {
    const moduleRef = useRef<Module<{ theService: S }> | undefined>(undefined);

    if (moduleRef.current == null) {
      const service = createService();
      moduleRef.current = createModule({ theService: service }, params);
    }

    useEffect(() => {
      moduleRef.current?.start();
      return () => {
        moduleRef.current?.stop();
      };
    }, []);

    return (
      <context.Provider value={moduleRef.current.services.theService}>
        {children}
      </context.Provider>
    );
  };

  const useService = (): ServiceToClient<S> => {
    const res = useContext(context);
    if (res == null) {
      throw new Error(
        "useService was used without a matching Provider.\nDid you forget to use the <ServiceProvider> component in the tree?",
      );
    }
    return res;
  };

  return { ServiceProvider, useService };
}

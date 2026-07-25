import {
  createModule,
  type Module,
  type ModuleParams,
  type Service,
  type ServiceClient,
  type ServiceDescriptor,
  type ValidConcreteService,
} from '@baby-yak/service-loom-js';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

export type ServiceProviderProps<D extends ServiceDescriptor<any>> = {
  children?: ReactNode;
  /** Factory called once on mount to create the service instance. */
  createService: () => ValidConcreteService<Service<D>>;
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
export function createServiceContext<D extends ServiceDescriptor<any>>(params?: ModuleParams) {
  // create inside the function ! new context hierarchy and type for every service/module kind.
  const context = createContext<ServiceClient<D> | null>(null);

  const ServiceProvider = ({ createService, children }: ServiceProviderProps<D>) => {
    type M = { theService: Service<D> };

    const moduleRef = useRef<Module<M> | undefined>(undefined);

    if (moduleRef.current == null) {
      const service = createService();
      moduleRef.current = createModule<M>({ theService: service }, params);
    }

    useEffect(() => {
      moduleRef.current?.start().catch((e: unknown) => console.error(e));

      return () => {
        moduleRef.current?.stop().catch((e: unknown) => console.error(e));
      };
    }, []);

    return (
      <context.Provider value={moduleRef.current.services.theService}>{children}</context.Provider>
    );
  };

  const useService = (): ServiceClient<D> => {
    const res = useContext(context);
    if (res == null) {
      throw new Error(
        'useService was used without a matching Provider.\nDid you forget to use the <ServiceProvider> component in the tree?',
      );
    }
    return res;
  };

  return { ServiceProvider, useService };
}

import { Module_Imp } from './internal/module_imp.js';
import type { Module } from './module.js';
import type { ModuleDescriptor, ModuleParams, ModuleServices } from './types.js';

//-------------------------------------------------------

export function createModule<M extends ModuleDescriptor>(
  services: M & ModuleServices<M>,
  options?: ModuleParams,
): Module<M> {
  return new Module_Imp(services, options);
}

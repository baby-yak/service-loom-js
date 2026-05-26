import type { EventClient } from '../../events/index.js';
import type { ReactiveStateClient } from '../../reactiveState/index.js';
import type { Module } from '../module.js';
import type { ModuleClient } from '../moduleClient.js';
import type {
  ModuleDescriptor,
  ModuleEvents,
  ModuleServiceClients,
  ModuleState,
} from '../types.js';

export class ModuleClient_imp<M extends ModuleDescriptor> implements ModuleClient<M> {
  readonly name: string;
  readonly state: ReactiveStateClient<ModuleState>;
  readonly events: EventClient<ModuleEvents>;
  readonly services: ModuleServiceClients<M>;

  constructor(source: Module<M>) {
    this.name = source.name;
    this.state = source.state;
    this.events = source.events;
    this.services = source.services;
  }
}

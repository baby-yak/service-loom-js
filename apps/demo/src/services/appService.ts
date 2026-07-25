import { Service, type ServiceDescriptor } from '@baby-yak/service-loom-js';
import type { AppDesc } from './app';

export type IApp = ServiceDescriptor<{
  state: {
    started: boolean;
  };
  actions: {
    setStarted(value: boolean): void;
  };
}>;

export class AppService extends Service<IApp, AppDesc> implements IApp {
  constructor() {
    super('app', { started: false });
  }
  setStarted(value: boolean): void {
    this.state.update((s) => (s.started = value));
  }
}

import { createModule, type Service } from '@baby-yak/service-loom-js';
import { CounterService, type ICounter } from './counterService';
import { UsersService, type IUsers } from './userService';
import { AppService, type IApp } from './appService';

export type AppDesc = {
  app: Service<IApp>;
  counter: Service<ICounter>;
  users: Service<IUsers>;
};
export const app = createModule<AppDesc>(
  {
    app: new AppService(),
    counter: new CounterService(),
    users: new UsersService(),
  },
  { verbose: true },
);

export const services = app.services;

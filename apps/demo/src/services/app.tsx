import { createModule, type Service } from '@baby-yak/service-loom-js';
import { CounterService, type ICounter } from './courerService';
import { UsersService, type IUsers } from './userService';

export type AppDesc = {
  counter: Service<ICounter>;
  users: Service<IUsers>;
};
export const app = createModule<AppDesc>(
  {
    counter: new CounterService(),
    users: new UsersService(),
  },
  { verbose: true },
);

export const module = app.client;
export const services = app.services;

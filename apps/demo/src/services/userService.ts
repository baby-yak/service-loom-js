import { Service, type ServiceDescriptor } from '@baby-yak/service-loom-js';
import { v4 as uuid } from 'uuid';
import { delay } from '../utils';
import type { AppDesc } from './app';

export type User = {
  id: string;
  name: string;
};

export type IUsers = ServiceDescriptor<{
  state: {
    users: User[];
  };
  actions: {
    add(name: string): Promise<string>;
    fetch(id: string): Promise<User>;
  };
}>;

export class UsersService extends Service<IUsers, AppDesc> implements IUsers {
  constructor() {
    super('users', { users: [] });
  }

  async onServiceInit() {
    await delay(1000);
  }

  async add(name: string) {
    await delay(1000);
    if (name.trim() === '') {
      throw new Error('nope');
    }

    //get a ref to the counter service
    const counter = this.getModule().counter;
    const count = counter.state.get().count;

    const id = uuid();
    console.log('adding ', name, id);
    this.state.update((s) =>
      s.users.push({
        id,
        name: `${name} - ${count}`,
      }),
    );
    console.log('ok');
    return id;
  }
  async fetch(id: string) {
    await delay(1000);
    const { users } = this.state.get();
    const user = users.find((x) => x.id === id);
    if (!user) {
      throw new Error('no user');
    }

    return user;
  }
}

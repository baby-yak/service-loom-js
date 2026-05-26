import { Service } from "@baby-yak/service-loom-js";
import { delay } from "../utils";
import { v4 as uuid } from "uuid";
import type { AppDesc } from "./app";

export type User = {
  id: string;
  name: string;
};

export type IUsers = {
  state: {
    users: User[];
  };
  // events: {
  //   //no
  // };
  actions: {
    add(name: string): Promise<string>;
    fetch(id: string): Promise<User>;
  };
};

export class UsersService extends Service<IUsers> {
  constructor() {
    super({ users: [] }, { name: "users" });
    this.actions.setHandler(this);
  }

  async onServiceInit() {
    await delay(1000);
  }

  async add(name: string) {
    await delay(1000);
    if (name.trim() === "") {
      throw new Error("nope");
    }

    //get a ref to the counter service
    const counter = this.getModule<AppDesc>().services.counter;
    const count = counter.state.get().count;

    const id = uuid();
    console.log("adding ", name, id);
    this.state.update((s) =>
      s.users.push({
        id,
        name: `${name} - ${count}`,
      }),
    );
    console.log("ok");
    return id;
  }
  async fetch(id: string) {
    await delay(1000);
    const { users } = this.state.get();
    const user = users.find((x) => x.id === id);
    if (!user) {
      throw new Error("no user");
    }

    return user;
  }
}

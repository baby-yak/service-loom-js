# @baby-yak/service-loom-js

> [!IMPORTANT]
> **Beta** - API is stable but the package is still early. Feedback welcome.

A typed TypeScript toolkit for building event-driven, reactive applications — events, state, and services in one package.

## Install

```bash
npm install @baby-yak/service-loom-js
```

## What's inside

| Module   | Description                                                      | Docs                                     |
| -------- | ---------------------------------------------------------------- | ---------------------------------------- |
| Services | Typed base class for building self-contained services            | [→ docs/services.md](./docs/services.md) |
| Modules  | Lifecycle orchestrator for a set of services                     | [→ docs/modules.md](./docs/modules.md)   |
| Events   | Typed event emitter with wildcard, once, and async/await support | [→ docs/events.md](./docs/events.md)     |
| State    | Reactive state with immer and selector support                   | [→ docs/state.md](./docs/state.md)       |
| Actions  | Action dispatcher                                                | [→ docs/actions.md](./docs/actions.md)   |
| Helpers  | Type guards (`isService`, `isStateClient`, …) for all entities   | [→ docs/helpers.md](./docs/helpers.md)   |

## Quick start

### Services

Define a descriptor type with `ServiceDescriptor<Shape>`, then extend `Service` and implement the action methods directly on the class:

```ts
import { Service, ServiceDescriptor } from '@baby-yak/service-loom-js';

type IServer = ServiceDescriptor<{
  state: { address: string };
  events: { connected: () => void };
  actions: { connect(port: number): void };
}>;

class ServerService extends Service<IServer> implements IServer {
  constructor() {
    super('server', { address: '' });
  }

  protected onServiceInit() {
    /* standalone setup — DB connect, config load */
  }
  protected onServiceStart() {
    /* cross-service wiring — safe to call other services here */
  }

  connect(port: number) {
    this.state.update((s) => {
      s.address = `host:${port}`;
    });
    this.events.emit('connected');
  }
}

const server = new ServerService();
```

**Accessing sibling services — `getModule()`:**

Declare the module shape as the second type parameter of `Service`. From `onServiceStart` onward, call `this.getModule()` to access all sibling services:

```ts
type App = {
  server: Service<IServer>;
  db: Service<IDb>;
};

class ServerService extends Service<IServer, App> {
  protected onServiceStart() {
    const db = this.getModule().services.db;
    db.state.subscribe((s) => console.log('db address:', s.address));
  }
}
```

`getModule()` throws if called before `onServiceStart` — dependencies are only available from that phase onward.

[→ Full services docs](./docs/services.md)

---

### Modules

Collect services into a module and call `start()` to run the lifecycle. Access typed clients via `module.services`.

```ts
import { createModule } from '@baby-yak/service-loom-js';

// Let TypeScript infer the descriptor from the services:
const app = createModule({
  server: new ServerService(),
  db: new DbService(),
});

// Or provide the descriptor explicitly:
type App = {
  server: Service<IServer>;
  db: Service<IDb>;
};
const app = createModule<App>({
  server: new ServerService(),
  db: new DbService(),
});

await app.start();
// later: await app.stop();

// export the typed service client map:
export const services = app.services;
```

**Using the services:**

```ts
const server = app.services.server;
server.actions.invoke.connect(8080);
server.events.on('connected', () => console.log('connected!'));
server.state.subscribe((s) => console.log(s.address));

const db = app.services.db;
const newItem = await db.actions.invoke.addItem('hat');
```

[→ Full modules docs](./docs/modules.md)

---

### Events

```ts
import { EventEmitter } from '@baby-yak/service-loom-js';

type AppEvents = {
  userJoined: (userId: string) => void;
  scoreChanged: (userId: string, score: number) => void;
};

const emitter = new EventEmitter<AppEvents>();
emitter.on('userJoined', (id) => console.log(id));
emitter.emit('userJoined', 'alice');
```

---

### State

```ts
import { ReactiveState } from '@baby-yak/service-loom-js';

const state = new ReactiveState({ count: 0, name: 'Alice' });

state.subscribe((next) => console.log(next.count));

state.update({ count: 1 }); // shallow merge
state.update((draft) => {
  draft.count += 1;
}); // immer recipe
```

---

### Actions

```ts
import { ActionExecuter } from '@baby-yak/service-loom-js';

type AppActions = {
  greet(name: string): void;
  add(a: number, b: number): number;
};

const actions = new ActionExecuter<AppActions>();

// Wire up a whole class at once
class MyService {
  greet(name: string) {
    console.log(`Hello, ${name}`);
  }
  add(a: number, b: number) {
    return a + b;
  }
}
actions.setHandler(new MyService());

// Or register individual handlers (takes priority over the class)
actions.setHandler('add', (a, b) => a + b + 1);

// Invoke via a typed client — no write access
const client = actions.client;
client.greet('Alice');
console.log(client.add(1, 2)); // 4
```

---

## License

MIT

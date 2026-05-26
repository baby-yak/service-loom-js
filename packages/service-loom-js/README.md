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
| Helpers  | Type guards (`isService`, `isStateClient`, …) for all entities  | [→ docs/helpers.md](./docs/helpers.md)   |

## Quick start

### Services

Services are complete behaviour components.
They hold state, fire events and have invoked actions.
First we define the service "shape":

```ts
import { Service } from '@baby-yak/service-loom-js';

type IServer = {
  state: { address: string };
  events: { connected: () => void };
  actions: { connect(port: number): void };
};
```

Now we can create the service - there are two supported styles for that.
Choose you weapon:

**options 1: OOP — extend `Service` and override methods:**

```ts
import { Service } from '@baby-yak/service-loom-js';

class ServerService extends Service<IServer> {
  constructor() {
    super({ address: '' }, { name: 'server' });
    this.actions.setHandler(this);
  }

  protected onServiceInit() {
    /* standalone setup */
  }
  protected onServiceStart() {
    /* cross-service wiring */
  }

  connect(port: number) {
    this.state.update((s) => {
      s.address = `host:${port}`;
    });
    this.events.emit('connected');
  }
}

// then later instantiate:
const server = new ServerService();
```

**Options 2: Compositional — `createService()` factory method.**
(Can assign lifecycle callbacks)

```ts
import { createService } from '@baby-yak/service-loom-js';

const server = createService<IServer>('server', { address: '' });

// life cycle
server.onInit = async () => {
  /* standalone setup */
};
server.onStart = () => {
  /* cross-service wiring */
};

// implement service's actions and use state and events:
server.actions.setHandler('connect', (port) => {
  server.state.update((s) => {
    s.address = `host:${port}`;
  });
  server.events.emit('connected');
});
```

**Accessing sibling services — `getModule<M>()`:**

From `onServiceStart` onward, a service can reach its parent module and read state or invoke actions on siblings:

```ts
type App = { server: IServer; db: IDb };

class ServerService extends Service<IServer> {
  protected onServiceStart() {
    const db = this.getModule<App>().services.db;
    db.state.subscribe((s) => console.log('db address:', s.address));
  }
}
```

`getModule()` throws if called in the constructor or `onServiceInit` — the module is injected after that phase.

[→ Full services docs](./docs/services.md)

---

### Modules

Collect services into a module. Call `start()` to run the lifecycle and access typed clients via `module.services`.

```ts
import { createModule } from '@baby-yak/service-loom-js';

// Explicit descriptor:
type App = {
  server: Service<IServer>;
  db: Service<IDb>;
};
const app = createModule<App>({
  server: new ServerService(),
  db: new DbService(),
});

// Or let TypeScript infer the descriptor from the services:
const app = createModule({
  server: new ServerService(),
  db: new DbService(),
});

app.start(); // void — fire and forget
app.stop();  // void — fire and forget

// export the services client facade to the world:
// the type is { [name] : ServiceClient<descriptor> }
export const services = app.services;
```

**Using the services:**

```ts
const server = app.services.server;
server.actions.connect(8080);
server.events.on('connected', () => console.log('connected!'));
server.state.subscribe((s) => console.log(s.address));

const db = app.services.db;
const newItem = await db.actions.addItem('hat');
```

**Module state and events:**
you can also react to the module itself
listen to when the module is started and stopped:

```ts
app.state.subscribe(({ isStarted }) => console.log('started:', isStarted));
app.events.on('started', () => console.log('all services ready'));
app.events.on('stopped', () => console.log('all services stopped'));
app.events.on('errorStarting', (err) => console.error('start failed:', err));
```

`waitForStart()` / `waitForStop()` — await completion explicitly (useful in tests, server boot, CLI tools):

```ts
app.start();
await app.waitForStart(); // resolves when started, rejects on error
```

**`module.client`** — read-only facade (`state` + `events` + `services`) without `start`/`stop`:

```ts
export const moduleClient = app.client;
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

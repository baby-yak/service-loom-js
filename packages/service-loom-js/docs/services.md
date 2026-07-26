# Services

A typed base class for building self-contained, composable services. Each service owns its state, events, and actions — and exposes a read-only client for the rest of the application.

## Overview

Extend `Service<Descriptor>`, implement the action methods on the class, and override lifecycle hooks to set up and tear down the service.

## Defining a descriptor

A descriptor describes the shape of a service — its state, events, and actions. Wrap the shape in `ServiceDescriptor<Shape>` and pass it as the type parameter to `Service<Descriptor>`.

```ts
import { Service, ServiceDescriptor } from '@baby-yak/service-loom-js';

type IServer = ServiceDescriptor<{
  state: {
    address: string;
    port: number;
  };
  events: {
    connected: () => void;
    disconnected: (reason: string) => void;
  };
  actions: {
    connect(port: number): Promise<void>;
    disconnect(): void;
  };
}>;
```

All three fields (`state`, `events`, `actions`) are optional. Omit any you don't need:

```ts
type ILogger = ServiceDescriptor<{
  actions: { log(message: string): void };
  // no state, no events
}>;
```

## Creating a service

Extend `Service<Descriptor>` and `implements Descriptor` to let TypeScript enforce that every action method is present on the class.

```ts
type ICounter = ServiceDescriptor<{
  state: { count: number };
  events: { changed: () => void };
  actions: {
    increment(): void;
    reset(): void;
  };
}>;

class CounterService extends Service<ICounter> implements ICounter {
  constructor() {
    // first arg: name (string | undefined)
    // second arg: initial state (required when state is declared)
    super('counter', { count: 0 });
  }

  // lifecycle hooks (all optional):
  protected onServiceInit() {
    // standalone setup — DB connect, config load
  }
  protected onServiceStart() {
    // cross-service wiring — safe to call getModule() here
  }

  // action methods — automatically wired by the base class:
  increment() {
    this.state.update((s) => {
      s.count += 1;
    });
    this.events.emit('changed');
  }

  reset() {
    this.state.update((s) => {
      s.count = 0;
    });
    this.events.emit('changed');
  }
}
```

> The `Service` base class automatically calls `this.actions.setHandler(this)` in its constructor, so you never need to wire action methods up manually.

### Stateless services

Omit the initial state argument when your descriptor has no `state` field:

```ts
type ILogger = ServiceDescriptor<{
  actions: { log(msg: string): void };
}>;

class LoggerService extends Service<ILogger> implements ILogger {
  constructor() {
    super('logger'); // no initial state
  }
  log(msg: string) {
    console.log(`[log] ${msg}`);
  }
}
```

## State

`this.state` is a `ReactiveState` scoped to this service.

```ts
this.state.update((s) => { s.address = `host:${port}`; }); // immer recipe
this.state.update({ address: 'host:8080' });                // shallow merge
this.state.get();                                           // read current value
```

[→ Full state docs](./state.md)

## Events

`this.events` is an `EventEmitter` scoped to this service. Emit internally; external consumers listen through the client.

```ts
this.events.emit('connected');
this.events.emit('disconnected', 'timeout');
```

[→ Full events docs](./events.md)

## Actions

`this.actions` is an `ActionExecuter`. The base class wires `this` as the default handler, so every method on the class that matches an action name is automatically callable.

You can also register individual handlers — they take priority over the class methods:

```ts
this.actions.setHandler('connect', (port) => { /* override */ });
```

To invoke an action from within the service:

```ts
this.invoke.connect(8080);
```

[→ Full actions docs](./actions.md)

## Getting a client

`service.client` is a `ServiceClient` — a read-only facade with typed `state`, `events`, and `actions`. This is what external code and `Module` use to interact with the service.

```ts
const client = service.client;

client.state.get();                            // read state
client.state.subscribe((s) => { ... });        // reactive subscription
client.events.on('connected', () => { });      // listen to events
client.actions.connect(8080);                  // invoke actions
```

---

## Lifecycle phases

All lifecycle methods are optional. They are called by `Module` in order during `start()` and `stop()`. Within each phase all services run **in parallel**; the next phase begins only after all services complete.

**Start (`module.start()`)**

| Method                | When                                      | Intended use                                                              |
| --------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `onServiceInit`       | First, before any other service starts    | **Standalone setup** — DB connect, config load, internal state            |
| `onServiceStart`      | After all services have initialized       | **Cross-service wiring** — listeners, state reads, action calls           |
| `onServiceAfterStart` | After all services have finished starting | **Post-start hooks** — e.g. catch-all route after all routes are mounted  |

`getModule()` is available from `onServiceStart` onward. Calling it in the constructor or `onServiceInit` **will throw**.

**Stop (`module.stop()`)**

| Method                  | When                                        | Intended use                                             |
| ----------------------- | ------------------------------------------- | -------------------------------------------------------- |
| `onServiceBeforeStop`   | First, while all services are still running | **Cross-service ops before teardown**                    |
| `onServiceStop`         | After all `onServiceBeforeStop` complete    | **Standalone teardown** — close connections, unregister  |

## Accessing the module — `getModule()`

From `onServiceStart` onward, a service can access its parent module's service client map via `getModule()`.

Declare the module shape (a `ModuleDescriptor`) as the second type parameter of `Service`:

```ts
type App = {
  server: Service<IServer>;
  db: Service<IDb>;
};

class ServerService extends Service<IServer, App> {
  protected onServiceStart() {
    const db = this.getModule().services.db;
    db.state.subscribe((s) => console.log('db:', s));
  }
}
```

Properties set from `onServiceStart` should be declared with `!`:

```ts
class ServerService extends Service<IServer, App> {
  private db!: App['db']['client']; // set in onServiceStart

  protected onServiceStart() {
    this.db = this.getModule().services.db;
  }
}
```

You can also pass the module instance type directly (useful when you have the module type but not the descriptor):

```ts
declare const app: Module<App>;

class ServerService extends Service<IServer, typeof app> {
  protected onServiceStart() {
    this.getModule().services.db.state.get();
  }
}
```

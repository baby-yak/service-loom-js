# Modules

A lifecycle orchestrator for a set of services. `createModule` wires up service clients, runs startup and shutdown in the correct order, and exposes a fully typed `services` map for the rest of the application.

## Quick start

```ts
import { createModule } from '@baby-yak/service-loom-js';

const app = createModule({
  counter: new CounterService(),
  server: new ServerService(),
  db: new DbService(),
});

await app.start();

// export the typed service client map across the application:
export const services = app.services;
```

Use the services in other app components:

```ts
services.server.actions.connect(8080);
services.server.events.on('connected', () => console.log('online'));
services.db.state.subscribe((s) => console.log(s));
```

## `createModule` — call signatures

```ts
// infer module shape from the services passed
createModule({ counter: new CounterService(), server: new ServerService() })

// with options
createModule(
  { counter: new CounterService(), server: new ServerService() },
  { name: 'app', verbose: true },
)

// explicit module descriptor — enforces the shape
createModule<App>({ counter: new CounterService(), server: new ServerService() })
```

## Defining the module type

Without a type param, TypeScript infers the shape from the services you pass:

```ts
const app = createModule({
  server: new ServerService(),
  db: new DbService(),
  counter: new CounterService(),
});
```

Use an explicit descriptor for stronger type safety or to document the intended shape. Values must be `Service<D>` (or `RemoteService<D>`) instances:

```ts
type App = {
  server: Service<IServer>;
  db: Service<IDb>;
  counter: Service<ICounter>;
};

const app = createModule<App>({
  server: new ServerService(),
  db: new DbService(),
  counter: new CounterService(),
});
```

## `module.services`

After construction, `module.services` holds a typed `ServiceClient` for each service, keyed by the same names as the constructor input.

```ts
app.services.server.state.get();
app.services.server.events.on('connected', handler);
app.services.server.actions.connect(8080);
```

**Typing `module.services`** — use `ModuleClients` to extract the type:

```ts
import type { ModuleClients } from '@baby-yak/service-loom-js';

// from the descriptor type:
const services: ModuleClients<App> = app.services;
```

## Lifecycle

### Startup — `module.start()`

Runs three phases in sequence. Within each phase, all services run **in parallel**; the next phase begins only after every service completes the current one.

```
onServiceInit       — all services run in parallel
onServiceStart      — all services run in parallel
onServiceAfterStart — all services run in parallel
```

```ts
await app.start();
// all services fully started at this point
```

The promise rejects if any service throws during startup.

### Shutdown — `module.stop()`

Runs two phases in sequence, in parallel per phase:

```
onServiceBeforeStop — all services run in parallel
onServiceStop       — all services run in parallel
```

```ts
await app.stop();
```

Concurrent calls are safe — a `stop()` that arrives while `start()` is in progress will wait for startup to finish before running.

Calling `start()` when already started, or `stop()` when already stopped, is a no-op.

See [→ docs/services.md](./services.md) for what each lifecycle method is intended for.

## Options

```ts
const app = createModule(
  { server: new ServerService() },
  { name: 'app', verbose: true },
);
```

| Option    | Type      | Default       | Description                              |
| --------- | --------- | ------------- | ---------------------------------------- |
| `name`    | `string`  | `'untitled'`  | Identifies the module in logs            |
| `verbose` | `boolean` | `false`       | Log each phase transition to the console |

With `verbose: true`, the console prints each phase transition as it completes:

```
module initialization...
 ✅ [server ] - init
 ✅ [db     ] - init
 ✅ [server ] - start
 ✅ [db     ] - start
 ✅ [server ] - after-start
 ✅ [db     ] - after-start
module initialization complete
```

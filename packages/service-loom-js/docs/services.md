# Services

A typed base class for building self-contained, composable services. Each service owns its state, events, and actions — and exposes a read-only client for use by the rest of the application.

## Two ways to create a service

Both styles produce the same `Service<D>` type and work identically with the container `Module`.

**OOP style**
Extend the `Service` class and override lifecycle methods in your subclass.
Best when you want a class-based structure with clear method boundaries.

**Compositional style**
Use the factory method `createService()` to instantiate a service.
assign lifecycle callbacks as properties.
Best when you prefer functions over classes, or want to build services dynamically.

---

In any on the coding styles - we first have to define the service shape [(see more bellow...)](#defining-a-service-descriptor)

```ts
type ICounter = {
  state: {
    count: number;
  };
  events: {
    changed: () => void;
  };
  actions: {
    increment(): void;
    reset(): void;
  };
};
```

## OOP style

Extend `Service`, override lifecycle hooks and either implement action methods directly on the class, or use setHandler for each implemented action.

```ts
import { Service } from '@baby-yak/service-loom-js';

class CounterService extends Service<ICounter> {
  constructor() {
    super({ count: 0 }, { name: 'counter' });

    // implement service actions (choose one option):

    // # option 1: route all actions to methods
    //   mapping action name -> method name
    this.actions.setHandler(this);

    // # option 2: use fine grain handlers
    this.actions.setHandler("increment" , ()=>{ ... });
    this.actions.setHandler("reset" , ()=>{ ... });
  }

  // -- override life cycle methods if needed:

  protected onServiceInit(){
    //initialize service if needed
  }
  protected onServiceStart(){
    //can use other services, they all have been initialized by now.
  }

  // -- action handler methods:

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

## Compositional style

Use `createService()` to build a service without a class. Assign lifecycle callbacks as properties and register action handlers imperatively.

### `createService` — call signatures

```ts
// no state — returns Service<EMPTY>
createService()
createService({ name: 'myService' })

// infer state shape from initial value — returns Service<{ state: S }>
createService({ count: 0 })
createService({ count: 0 }, { name: 'counter' })

// explicit descriptor — enforces full shape — returns Service<ICounter>
createService<ICounter>({ count: 0, step: 1 })
createService<ICounter>({ count: 0, step: 1 }, { name: 'counter' })
```

### `createRawService` — custom state provider

For advanced use cases where you want to plug in a custom state implementation instead of the default `ReactiveState`:

```ts
// infer descriptor from provider — returns RawService<{ state: InferState<SP> }, SP>
createRawService(myProvider)
createRawService(myProvider, { name: 'myService' })

// explicit descriptor — enforces full shape
createRawService<IServer, MyProvider>(myProvider)
createRawService<IServer, MyProvider>(myProvider, { name: 'server' })
```

---

```ts
import { createService } from '@baby-yak/service-loom-js';

// create the service
const counter = createService<ICounter>({ count: 0 }, { name: 'counter' });

// attach life cycle callbacks if needed
counter.onInit = () => {
  console.log('counter ready');
};

// attach action handlers
counter.actions.setHandler('increment', () => {
  counter.state.update((s) => {
    s.count += 1;
  });
  counter.events.emit('changed');
});

counter.actions.setHandler('reset', (n) => {
  counter.state.update((s) => {
    s.count = n ?? 0;
  });
  counter.events.emit('changed');
});
```

### Defining a service descriptor

A descriptor is a plain type literal that describes the shape of the service. Pass it as the type parameter to `Service<Desc>`.

```ts
type IServer = {
  state: {
    address: string;
    port: number
  };
  events: {
    connected: () => void;
    disconnected: (reason: string) => void
  };
  actions: {
    connect(port: number): Promise<void>;
    disconnect(): void
    createItem(item:Item): Promise<string>;
    getItem(id:string, collection:string): Item;
  };
};

class ServerService extends Service<IServer> { ... }
```

All three fields are optional. Omit any you don't need:

```ts
type ILogger = {
  actions: { log(message: string): void };
  // no state, no events
};
```

### State

`this.state` is a `ReactiveState` instance scoped to this service. Use `update()` to mutate and `get()` to read.

```ts
this.state.update((s) => {
  s.address = `host:${port}`;
}); // immer recipe
this.state.update({ address: 'host:8080' }); // shallow merge
this.state.get(); // read current value
```

### Events

`this.events` is a `EventEmitter` scoped to this service. Emit internally; external consumers listen through the client.

```ts
this.events.emit('connected');
this.events.emit('disconnected', 'timeout');
```

### Actions

`this.actions` is an `ActionExecuter`. Register handlers using `setHandler`.

> [!NOTE]
> in the OOP style : use `this.___`
> in the compositional style : use `service.___`

```ts
// Bulk — wire up all methods from the class instance at once
this.actions.setHandler(this);

// Individual — useful for lambdas or overriding one method
this.actions.setHandler('connect', (port) => { ... });
```

Use `this.invoke()` as shorthand for `this.commands.invoke()`:

```ts
this.invoke.connect(8080);
```

## Getting a client

`service.client` is a `ServiceClient` — a read-only facade with typed `state`, `events`, and `actions`. This is what external code and `Module` use to interact with the service.

```ts
const client = service.client;

client.state.get();                         // read state
client.state.subscribe(s => { ... });       // reactive subscription
client.events.on('connected', () => { });   // listen to events
client.actions.connect(8080);               // invoke actions
```

---

## Lifecycle phases

Both styles share the same five phases, called by `Module` in order:

**Start up (`module.start()`)**

| Method / property                       | When                                      | Intended use                                                              |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------- |
| `onInit`<br>`onServiceInit`             | First, before any other service starts    | **Standalone setup**<br>DB connect, config load, internal state           |
| `onStart`<br>`onServiceStart`           | After all services have initialized       | **Cross-service wiring**<br>listeners, state reads, action calls          |
| `onAfterStart`<br>`onServiceAfterStart` | After all services have finished starting | **Post-start setup**<br>e.g. catch-all route after all routes are mounted |

the module reference is injected after all services finish `onInit`.  
`getModule()` is available in `onStart` and after. accessing it before **will** throw an error!

**Shut down (`module.stop()`)**

| Method / property                       | When                                        | Intended use                                             |
| --------------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| `onBeforeStop`<br>`onServiceBeforeStop` | First, while all services are still running | **Cross-service ops before teardown**                    |
| `onStop`<br>`onServiceStop`             | After all `onBeforeStop` phases complete    | **Standalone teardown**<br>close connections, unregister |

## Accessing the module — `getModule<M>()`

From `onServiceStart` onward, a service can access its parent module via `getModule<M>()`. Pass the module's descriptor type to get a fully typed `ModuleClient`:

```ts
type AppModule = {
  server: IServer;
  db: IDatabase;
};

class ServerService extends Service<IServer> {
  private get module() {
    return this.getModule<AppModule>();
  }

  onServiceStart() {
    // read sibling state
    const dbState = this.module.services.db.state.get();

    // subscribe to module lifecycle
    this.module.events.on('stopped', () => this.disconnect());
  }
}
```

`getModule()` throws if called in the constructor or `onServiceInit` — the module is not yet attached at that point. Properties that depend on it should be declared with `!`:

```ts
class ServerService extends Service<IServer> {
  private db!: ServiceToClient<Service<IDatabase>>; // set in onServiceStart

  onServiceStart() {
    this.db = this.getModule<AppModule>().services.db;
  }
}
```

`getModule<M>()` is unguarded — TypeScript trusts you to pass the correct `M`. If the service is used in a different module, the cast will silently be wrong.

# Actions

A typed action dispatcher. Define your action signatures once, wire up handlers anywhere, and invoke them through a read-only client.

## Quick start

```ts
import { ActionExecuter } from '@baby-yak/service-loom-js';

type AppActions = {
  greet(name: string): void;
  add(a: number, b: number): number;
};

const actions = new ActionExecuter<AppActions>();

// connect action handlers:
actions.setHandler('greet', (name) => console.log(`Hello, ${name}`));
actions.setHandler('add', (a, b) => a + b);

// self invocation
actions.invoke.greet('Alice'); // Hello, Alice
actions.invoke.add(1, 2); // 3

// later, for letting clients interact with this action executor in a safe way:
// (only invocation, no other control)
const client = actions.client;
client.invoke.greet('Alice'); // Hello, Alice
client.invoke.add(1, 2); // 3
```

## Wiring up a class

Pass any object or class instance that implements your action map. All methods are automatically available and `this` is correctly bound to the instance.

```ts
class GameService {
  private prefix = 'GAME';

  greet(name: string) {
    console.log(`[${this.prefix}] Hello, ${name}`);
  }

  add(a: number, b: number) {
    return a + b;
  }
}

actions.setHandler(new GameService());

actions.invoke.greet('Bob'); // [GAME] Hello, Bob
```

The class may have extra fields or methods beyond `AppActions` — only the actions defined in `T_Map` are callable through the client.

## Individual overrides

Individual handlers take priority over the execution target. Useful for replacing one method without reimplementing the whole class.

```ts
actions.setHandler(new GameService());

// Override just one action
actions.setHandler('add', (a, b) => a + b + 100);

actions.invoke.greet('Bob'); // from GameService
actions.invoke.add(1, 2); // 103 — from override
```

Priority order: **individual handler → execution target → catch-all → throw**.

## Read-only client

`actions.client` is an `ActionClient` — exposes an `invoke` proxy identical to `actions.invoke`, but without `setHandler`. Use it to give consumers call access without exposing control.

```ts
const client = actions.client;

client.invoke.greet('Alice'); // works
// client.setHandler(...)  — not available on ActionClient
```

Both `invoke` and `client.invoke` are live — they always reflect the latest registered handlers.

```ts
const client = actions.client;

// Register *after* getting the client — still works
actions.setHandler('greet', (name) => console.log(`Hi ${name}`));
client.invoke.greet('Alice'); // Hi Alice
```

## Async actions

Action handlers can be async — the return type flows through correctly.

```ts
type AppActions = {
  fetchUser(id: number): Promise<{ id: number; name: string }>;
};

const actions = new ActionExecuter<AppActions>();

actions.setHandler('fetchUser', async (id) => {
  const data = await fetch(`/users/${id}`);
  return data.json() as Promise<{ id: number; name: string }>;
});

const user = await actions.invoke.fetchUser(1);
```

Works with class methods too:

```ts
class UserService {
  async fetchUser(id: number) {
    return { id, name: 'Alice' };
  }
}

actions.setHandler(new UserService());
const user = await actions.invoke.fetchUser(1); // { id: 1, name: 'Alice' }
```

## Catch-all handler

Register a `'*'` handler to intercept any action that isn't covered by a specific handler or execution target. The catch-all receives the action name as its first argument, followed by the original call arguments.

```ts
type AppActions = {
  greet(name: string): void;
  add(a: number, b: number): number;
  fetchUser?(id: number): Promise<{ id: number; name: string }>;
};

const actions = new ActionExecuter<AppActions>();

actions.setHandler('*', (action, ...args) => {
  console.log(`[unhandled] ${action}`, args);
});

actions.invoke.greet('Alice'); // [unhandled] greet ['Alice']
actions.invoke.add(1, 2);     // [unhandled] add [1, 2]
```

Return a value from the catch-all and it propagates back to the caller:

```ts
actions.setHandler('*', (action, ...args) => `${action}:${args.join(',')}`);

const result = actions.invoke.add(1, 2); // 'add:1,2'
```

Works with optional actions too — the action name is still passed correctly:

```ts
actions.invoke.fetchUser?.(42); // [unhandled] fetchUser [42]
```

Specific handlers and execution target always take priority over catch-all:

```ts
actions.setHandler('add', (a, b) => a + b);    // specific
actions.setHandler(new GameService());          // execution target
actions.setHandler('*', () => 'fallback');      // lowest priority

actions.invoke.add(1, 2);    // from specific handler
actions.invoke.greet('Bob'); // from GameService
actions.invoke.noop();       // 'fallback' — not in specific or target
```

Full priority order: **individual handler → execution target → catch-all → throw**.

## Missing handler

If an action is invoked with no handler registered and no catch-all is set, it throws at call time:

```ts
const actions = new ActionExecuter<AppActions>();
actions.invoke.greet('Alice'); // throws: Action [greet] was not implemented
```

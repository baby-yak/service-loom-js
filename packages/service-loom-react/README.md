# @baby-yak/service-loom-react

> [!IMPORTANT]
> **Beta** - API is stable but the package is still early. Feedback welcome.

React hooks for [@baby-yak/service-loom-js](../service-loom-js/README.md) — connect your services to components with minimal boilerplate.

## Install

```bash
npm install @baby-yak/service-loom-react
```

Requires `react >= 17` and `@baby-yak/service-loom-js` as peer dependencies.

## Quick start

Services and modules live **outside React** — create them once, export, and consume anywhere with hooks. No providers needed for the common case.

```ts
// services.ts — create once, outside React
const app = createModule({
  counter: new CounterService(),
  server: new ServerService(),
});

app.start(); // void — errors go to module.events.on('errorStarting', ...)

export const services = app.services;
```

```tsx
// Counter.tsx — consume with hooks
import { services } from './services';

function Counter() {
  const count = useReactiveState(services.counter, (s) => s.count);
  const increment = useAction(services.counter, 'increment');

  return <button onClick={increment}>{count}</button>;
}
```

> For localizing services to a subtree of the component tree, see [Context Providers](#context-providers) below.

---

## Hooks

| Hook               | Description                                                     |
| ------------------ | --------------------------------------------------------------- |
| `useReactiveState` | Subscribe to service state, re-renders on change                |
| `useEvent`         | Subscribe to a service event for the component lifetime         |
| `useAction`        | Get a typed action function from a service                      |
| `useActionAsync`   | Track async action execution — loading, result, and error state |
| `useStateEffect`   | Run a side effect on state change, without re-rendering         |

---

### `useReactiveState`

Re-renders the component whenever the state changes. Accepts a `StateClient` or a `ServiceClient` with state.

```ts
// whole state
const state = useReactiveState(services.counter);

// with selector — only re-renders when the selected value changes
const count = useReactiveState(services.counter, (s) => s.count);
```

Both forms accept an optional `deps` array (same semantics as `useEffect`) to control when the subscription is re-created:

```ts
const value = useReactiveState(services.counter, (s) => s.count, []);
```

---

### `useEvent`

Subscribes to a service event and calls the listener whenever it fires. The subscription is set up on mount and torn down on unmount.

```ts
useEvent(services.server, 'connected', () => {
  console.log('server connected');
});
```

Pass a `deps` array to re-create the subscription when a dependency changes. Include any values the listener closes over:

```ts
useEvent(services.server, 'connected', () => console.log(`connected as ${userId}`), [userId]);
```

---

### `useAction`

Returns a typed action function. Equivalent to `services.myService.actions.someAction` — a convenience wrapper for uniform hook-style access. Does **not** subscribe to anything — no re-render, no cleanup.

```ts
const increment = useAction(services.counter, 'increment');
increment();
```

---

### `useActionAsync`

Tracks the async execution of an action — loading state, result, and error. Previous `data` is preserved while loading and on error, replaced only on success. Stale results from a previous call are discarded if `execute` is called again before it resolves.

```ts
const {
  execute: addItem,
  data,
  isLoading,
  isError,
  error,
} = useActionAsync(services.db, 'addItem');
addItem('new item');
```

Also accepts a raw function directly:

```ts
const {
  execute: fetchUser,
  data: user,
  isLoading,
} = useActionAsync((id: string) => fetch(`/api/users/${id}`).then((r) => r.json()));
```

**Return shape:**

| Field       | Type             | Description                          |
| ----------- | ---------------- | ------------------------------------ |
| `execute`   | function         | Call to trigger the action           |
| `data`      | `T \| undefined` | Last successful result               |
| `isLoading` | `boolean`        | `true` while the action is in flight |
| `isError`   | `boolean`        | `true` if the last call threw        |
| `error`     | `unknown`        | The thrown error, if any             |

---

### `useStateEffect`

Runs a side effect whenever state changes — **without causing a re-render**. Useful for analytics, logging, syncing to external systems.

The callback receives `(state, prev)` — also called once immediately on mount with `prev = undefined`. Guard against it if you only want changes:

```ts
useStateEffect(services.counter, (state, prev) => {
  if (prev === undefined) return; // skip initial call
  analytics.track('count_changed', { from: prev.count, to: state.count });
});
```

With a selector — only fires when the selected slice changes:

```ts
useStateEffect(
  services.counter,
  (s) => s.count,
  (count, prev) => console.log(`count: ${prev} → ${count}`),
);
```

Pass a `deps` array to control when the subscription is re-created:

```ts
useStateEffect(services.counter, (state) => doSomething(state, userId), [userId]);
```

---

## Working with `ServiceClient`

All hooks accept either a dedicated client (`StateClient`, `EventClient`, `ActionClient`) or a `ServiceClient` directly:

```ts
useReactiveState(services.counter); // ServiceClient
useReactiveState(services.counter.state); // StateClient directly
```

---

## Context Providers

For cases where services need to be **localized to a subtree** — multiple independent instances of the same service, per-route state, feature isolation — use the context factory helpers.

Each call to `createModuleContext` / `createServiceContext` creates an isolated context instance, so multiple providers in the same tree don't interfere.

> [!NOTE]
> **Caveats**
>
> - Service lifecycle is tied to the React tree — `start()` is called on mount, `stop()` on unmount. If this isn't what you want, create the module outside React instead (see [Quick start](#quick-start)).
> - In React's Strict Mode (development only), components intentionally mount → unmount → remount. The providers handle this correctly — the full lifecycle runs twice in sequence.
> - Lifecycle errors inside the provider are caught and logged via `module.events.on('errorStarting' / 'errorStopping')`. Register a listener on the module before passing it to the provider if you need custom error handling.

| Factory                | Description                                  |
| ---------------------- | -------------------------------------------- |
| `createModuleContext`  | Scoped Provider + hook for a set of services |
| `createServiceContext` | Scoped Provider + hook for a single service  |

### `createModuleContext`

```ts
type MyModule = {
  counter: ICounter;
  server: IServer;
};

// create once and export - fully typed provider and hook
export const {
  ModuleProvider, // the <Provider/> component
  useModule, // hook to get the module in the consumers
} = createModuleContext<MyModule>();
```

```tsx
// provide — services created once on mount, lifecycle managed automatically
<ModuleProvider
  createModule={() => ({
    counter: new CounterService(),
    server: new ServerService(),
  })}
>
  <App />
</ModuleProvider>
```

```ts
// consume anywhere in the subtree — returns ModuleClient (fully typed, no casting)
const { services, state, events } = useModule();
const { counter, server } = services;

// reactive lifecycle state:
const { isStarted } = useReactiveState(state);

// lifecycle events:
useEvent(events, 'started', () => console.log('ready'));
```

### `createServiceContext`

Same pattern for a single service:

```ts
export const {
  ServiceProvider, // the <Provider/>
  useService, // the hook for consumers
} = createServiceContext<CounterService>();
```

```tsx
<ServiceProvider createService={() => new CounterService()}>
  <CounterView />
</ServiceProvider>
```

```ts
//in consumers:
const counter = useService();
counter.actions.increment();
```

---

## License

MIT

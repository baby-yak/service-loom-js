# Events

A fully typed event emitter. Drop-in replacement for Node's `EventEmitter` with a generic type parameter that enforces event names and payload types at compile time.

## Quick start

```ts
import { EventEmitter } from '@baby-yak/service-loom-js';

type AppEvents = {
  userJoined: (userId: string) => void;
  scoreChanged: (userId: string, score: number) => void;
};

const emitter = new EventEmitter<AppEvents>();

emitter.on('userJoined', (userId) => {
  console.log(`${userId} joined`);
});

emitter.emit('userJoined', 'alice'); // ✓ typed
emitter.emit('userJoined', 42); // ✗ TypeScript error
```

## API

### Constructor

```ts
new EventEmitter(options?)
```

| Option                   | Type                         | Default  | Description                         |
| ------------------------ | ---------------------------- | -------- | ----------------------------------- |
| `maxListeners`           | `number`                     | `10`     | Warning threshold per event         |
| `listenersErrorHandling` | `ListenersErrorHandlingType` | `'warn'` | How listener exceptions are handled |

### Subscribing

```ts
// Persist until manually removed
emitter.on('event', listener);
emitter.addListener('event', listener); // alias for on()

// Fire once, then auto-remove
emitter.once('event', listener);

// Add at the front of the call queue
emitter.prependListener('event', listener);
emitter.prependOnceListener('event', listener);

// Returns an unsubscribe function
const unsub = emitter.subscribe('event', listener);
unsub(); // removes the listener

// Returns an unsubscribe function, fires only once
const unsub = emitter.subscribeOnce('event', listener);
unsub(); // cancel before it fires
```

### Wildcard listeners

Listen to every user event with `'*'`. The listener receives the event name followed by its args:

```ts
emitter.on('*', (event, ...args) => {
  console.log(`[${event}]`, args);
});
```

All subscribe methods accept `'*'`. Wildcard listeners fire before regular listeners. Internal events (`newListener`, `removeListener`) do not trigger wildcards.

### Waiting for an event

```ts
// Resolves with the event's args as a tuple on the next emit
const [userId] = await emitter.waitFor('userJoined');

// With a timeout (Node ≥ 18)
const [userId] = await emitter.waitFor('userJoined', {
  signal: AbortSignal.timeout(5000),
});
```

The promise rejects with `Error('aborted')` if the signal fires before the event. Passing an already-aborted signal rejects immediately.

### Emitting

```ts
emitter.emit('event', ...args): boolean
// Returns true if at least one listener was called, false otherwise.
// Only user-defined events can be emitted — internal events (newListener,
// removeListener) are fired automatically.
```

### Unsubscribing

```ts
emitter.off('event', listener);
emitter.removeListener('event', listener); // alias for off()
emitter.removeAllListeners(); // clear all events
emitter.removeAllListeners('event'); // clear one event
```

### Event client

`emitter.client` is a read-only view of the emitter — same listen API, no `emit`. Useful when you want to expose listening access without granting emit access.

```ts
const client = emitter.client;

client.on('userJoined', onUserJoined);
client.on('scoreChanged', onScoreChanged);
```

### Listener groups

A listener group lets you bulk-remove a set of listeners in one call. Call `createListenerGroup()` on the emitter or on any client to get a `{ client, detachGroup }` pair:

```ts
const group = emitter.createListenerGroup('my-component');

group.client.on('userJoined', onUserJoined);
group.client.on('scoreChanged', onScoreChanged);
group.client.once('close', onClose);

// later — removes every listener registered through this group
group.detachGroup();
```

Pass an event name to limit removal to a single event:

```ts
group.detachGroup('userJoined'); // removes only 'userJoined' listeners from this group
```

Groups are independent — detaching one never affects listeners registered through a different group or through the emitter directly. Groups created from a client are still scoped to the root emitter.

```ts
const client = emitter.client;
const group = client.createListenerGroup('child-group');

group.client.on('userJoined', handler);

group.detachGroup(); // removes handler — does not affect other listeners on client or emitter
```

### Default handlers

A default handler fires when an event is emitted but has no registered listeners. It is not counted by `listenerCount()` and does not cause `emit()` to return `true`.

```ts
emitter.setDefaultHandler('error', (err) => console.error('unhandled error:', err));

emitter.emit('error', new Error('oops')); // → default handler fires

emitter.on('error', myHandler);
emitter.emit('error', new Error('oops')); // → myHandler fires, default does not
```

Pass `undefined` to remove a previously set default handler:

```ts
emitter.setDefaultHandler('error', undefined);
```

### Introspection

```ts
emitter.listenerCount('event'): number
emitter.listeners('event'): Listener[]     // wrapped (once-aware)
emitter.rawListeners('event'): Listener[]  // original functions
emitter.eventNames(): string[]             // events with active listeners
```

### Listener limit

```ts
emitter.setMaxListeners(20)
emitter.getMaxListeners(): number

EventEmitter.defaultMaxListeners = 20 // global default for all new instances

emitter.setMaxListeners(0) // or Infinity — disables the warning
```

A `console.warn` is printed when a single event exceeds the limit. This is a leak warning, not a hard error.

### Error handling

Controls what happens when a listener throws:

```ts
emitter.setListenersErrorHandling('throw')
emitter.getListenersErrorHandling(): ListenersErrorHandlingType
```

| Mode                   | Behavior                                     |
| ---------------------- | -------------------------------------------- |
| `'warn'`               | `console.warn(...)` — default                |
| `'log'`                | `console.log(...)`                           |
| `'error'`              | `console.error(...)`                         |
| `'ignore'`             | Swallow silently                             |
| `'throw'`              | Rethrow — remaining listeners are not called |
| `(event, err) => void` | Custom handler                               |

In all modes except `'throw'`, remaining listeners continue to be called after an error.

### Internal events

These fire automatically and can be subscribed to like any other event:

```ts
emitter.on('newListener', (event, listener) => { ... })
emitter.on('removeListener', (event, listener) => { ... })
```

Subscribing/unsubscribing to `newListener` or `removeListener` themselves does **not** self-trigger these events.

## TypeScript

```ts
type MyEvents = {
  click: (x: number, y: number) => void;
  message: (text: string) => void;
  close: () => void;
};

const emitter = new EventEmitter<MyEvents>();
```

TypeScript enforces correct event names and argument types on every `emit`, `on`, `off`, and `once` call.

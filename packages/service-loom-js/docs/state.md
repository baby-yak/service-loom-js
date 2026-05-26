# State

A small, typed reactive state library. Uses [immer](https://immerjs.github.io/immer/) under the hood for simple, boilerplate-free state updates. For explicit immutable updates without immer, see [`updatePure()`](#pure-updates-updatepure).

## Quick start

```ts
import { ReactiveState } from '@baby-yak/service-loom-js';

const state = new ReactiveState({ count: 0, name: 'Alice' });

// Read current state (deeply readonly)
console.log(state.get().count); // 0

// Subscribe — fires immediately, then on every change
const unsub = state.subscribe((next, prev) => {
  console.log(prev?.count, '→', next.count);
});

// Replace a field (shallow merge)
state.update({ count: 1 });

// Deep mutation via immer recipe
state.update((draft) => {
  draft.count += 1;
});

// Full replacement
state.set({ count: 0, name: 'Bob' });

// Stop listening
unsub();
```

## Selectors

Derive a child `StateClient` that only emits when its selected value changes:

```ts
const count = state.select((s) => s.count);

count.subscribe((next, prev) => {
  console.log('count changed:', prev, '→', next);
});

// Chained selectors are flattened — no extra overhead
const upper = state.select((s) => s.name).select((name) => name.toUpperCase());
```

> **Caveat:** Selectors use `Object.is` for comparison. If your selector returns a new object on every call (e.g. `s => ({ ...s.nested })`), it will emit on every state update even if the data hasn't changed. Select a reference, not a reconstructed value.

## Read-only facade

Hand consumers a view that cannot mutate state:

```ts
const source = state.client; // StateClient<S> — no set/update
```

## Error handling

```ts
const state = new ReactiveState(0, {
  listenersErrorHandling: 'warn', // default
  // 'ignore' | 'log' | 'warn' | 'error' | 'throw' | (err) => void
});
```

## `set` vs `update`

**`set`** always does a full replacement:

```ts
const counter = new ReactiveState(0);
counter.set(1);

const user = new ReactiveState({ name: 'Alice', score: 0 });
user.set({ name: 'Alice', score: 1 }); // replaces everything
```

**`update`** is smarter:

```ts
const state = new ReactiveState({ name: 'Alice', address: { city: 'NY', zip: '10001' } });

// Partial — shallow merge, unmentioned fields preserved
state.update({ name: 'Bob' });
// → { name: 'Bob', address: { city: 'NY', zip: '10001' } }

// Immer recipe — deep mutation
state.update((draft) => {
  draft.address.city = 'LA'; // zip is preserved
});
// → { name: 'Bob', address: { city: 'LA', zip: '10001' } }

// ⚠️  Partial on a nested object replaces it wholesale — use a recipe for deep changes
state.update({ address: { city: 'SF' } });
// → { name: 'Bob', address: { city: 'SF' } }  zip is gone!
```

| State type        | `set(value)` | `update(partial)` | `update(recipe)`     | `updatePure(fn)`     |
| ----------------- | ------------ | ----------------- | -------------------- | -------------------- |
| Plain object      | Full replace | Shallow merge     | Deep mutation        | Explicit return      |
| Array / Map / Set | Full replace | Full replace      | Deep mutation        | Explicit return      |
| Primitive         | Full replace | Full replace      | Throws — use `set()` | Explicit return      |

## Pure updates (`updatePure`)

`updatePure()` lets you update state with an explicit immutable reducer instead of an immer draft:

```ts
const state = new ReactiveState({ count: 0, name: 'Alice' });

// Pure reducer — receives current (readonly) state, returns next state
state.updatePure((s) => ({ ...s, count: s.count + 1 }));

// Partial shorthand still works (shallow merge)
state.updatePure({ name: 'Bob' });
```

Use `updatePure()` when you prefer the explicit spread / functional style over immer's mutable draft model. Both `update()` and `updatePure()` are available on the same `ReactiveState` instance.

## Notes

- `enableMapSet()` from immer is called on import, enabling Map/Set support globally. You do not need to call it yourself.
- Listeners are called immediately on subscribe with `prev = undefined`.
- Equality is checked with `Object.is` — same reference means no notification.

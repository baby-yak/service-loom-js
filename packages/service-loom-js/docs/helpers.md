# Helpers

Type guards for all core Service-loom entities. Each guard checks for an internal brand symbol — not structural duck-typing — so they are reliable even across module boundaries.

```ts
import {
  isActionClient, isActionExecuter,
  isEventClient, isEventEmitter,
  isStateClient, isReactiveState,
  isServiceClient, isService,
  isModuleClient, isModule,
} from '@baby-yak/service-loom-js';
```

## Hierarchy

Each entity has two guards: one for the **source** (read-write) and one for the **client** (read-only). Sources are subtypes of their clients, so the client guard also matches sources.

| Guard | Matches |
|---|---|
| `isActionClient` | `ActionExecuter`, `ActionsClient_imp` (i.e. `actions.client`) |
| `isActionExecuter` | `ActionExecuter` only |
| `isEventClient` | `EventEmitter`, `EventClient_imp` (i.e. `emitter.client`) |
| `isEventEmitter` | `EventEmitter` only |
| `isStateClient` | `ReactiveState`, `StateClient_imp`, `StateSelector_imp` |
| `isReactiveState` | `ReactiveState` only |
| `isServiceClient` | `Service` subclasses, `ServiceClient_imp` (i.e. `service.client`) |
| `isService` | `Service` subclasses only |
| `isModuleClient` | `Module_Imp`, `ModuleClient_imp` (i.e. `module.client`) |
| `isModule` | `Module_Imp` only |

## Usage

```ts
function applyToState(obj: unknown) {
  if (isReactiveState(obj)) {
    obj.update(draft => { /* ... */ }); // typed as ReactiveState
  } else if (isStateClient(obj)) {
    obj.get();                           // typed as StateClient (read-only)
  }
}

function handleService(obj: unknown) {
  if (isService(obj)) {
    obj.invoke.myAction();  // full Service access
  } else if (isServiceClient(obj)) {
    obj.state.get();        // read-only ServiceClient access
  }
}
```

## Notes

- All guards return `false` for `null`, `undefined`, plain objects, and primitives.
- Brand symbols are internal — you cannot forge a positive result by constructing a plain object with matching keys.
- `isServiceClient(service)` is `true` because `Service extends Service_base extends ServiceClient_base` — the source IS the client.

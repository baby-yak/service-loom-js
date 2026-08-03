// type-only brands
export const _SHAPE_: unique symbol = Symbol('_SHAPE_');
export const _ACTIONS_: unique symbol = Symbol('_ACTIONS_');
export const _STATE_: unique symbol = Symbol('_STATE_');
export const _EVENTS_: unique symbol = Symbol('_EVENTS_');
export const _DESCRIPTOR_: unique symbol = Symbol('_DESCRIPTOR_');
export const _DEPENDENCIES_: unique symbol = Symbol('_DEPENDENCIES_');

// class brands: runtime discriminators + self-documenting type-level branching

// this is the class property for brands array `[_BRANDS_]:symbol[] = [_REMOTE_SERVICE_] `
export const _BRANDS_: unique symbol = Symbol('_BRANDS_');

// service brand values:

export const _SERVICE_: unique symbol = Symbol('_SERVICE_');
export const _REMOTE_SERVICE_: unique symbol = Symbol('_REMOTE_SERVICE_');

export const _SERVICE_CLIENT_: unique symbol = Symbol('_SERVICE_CLIENT_');
export const _REMOTE_SERVICE_CLIENT_: unique symbol = Symbol('_REMOTE_SERVICE_CLIENT_');

// providers brand values:

export const _ACTION_EXECUTER_: unique symbol = Symbol('_ACTION_EXECUTER_');
export const _ACTION_CLIENT_: unique symbol = Symbol('_ACTION_CLIENT_');
export const _REMOTE_ACTION_EXECUTER_: unique symbol = Symbol('_REMOTE_ACTION_EXECUTER_');
export const _REMOTE_ACTION_CLIENT_: unique symbol = Symbol('_REMOTE_ACTION_CLIENT_');

export const _REACTIVE_STATE_: unique symbol = Symbol('_REACTIVE_STATE_');
export const _REACTIVE_STATE_CLIENT_: unique symbol = Symbol('_REACTIVE_STATE_CLIENT_');
export const _REMOTE_STATE_: unique symbol = Symbol('_REMOTE_STATE_');
export const _REMOTE_STATE_CLIENT_: unique symbol = Symbol('_REMOTE_STATE_CLIENT_');

export const _EVENT_EMITTER_: unique symbol = Symbol('_EVENT_EMITTER_');
export const _EVENT_CLIENT_: unique symbol = Symbol('_EVENT_CLIENT_');
export const _REMOTE_EVENT_EMITTER_: unique symbol = Symbol('_REMOTE_EVENT_EMITTER_');
export const _REMOTE_EVENT_CLIENT_: unique symbol = Symbol('_REMOTE_EVENT_CLIENT_');

// type-only brands
export const _SHAPE_: unique symbol = Symbol('_SHAPE_');
export const _ACTIONS_: unique symbol = Symbol('_ACTIONS_');
export const _STATE_: unique symbol = Symbol('_STATE_');
export const _EVENTS_: unique symbol = Symbol('_EVENTS_');
export const _DESCRIPTOR_: unique symbol = Symbol('_DESCRIPTOR_');
export const _DEPENDENCIES_: unique symbol = Symbol('_DEPENDENCIES_');

// class brands: runtime discriminators + self-documenting type-level branching
export const _BRAND_SERVICE_BASE_: unique symbol = Symbol('_SERVICE_BASE_');
export const _BRAND_SERVICE_: unique symbol = Symbol('_SERVICE_');
export const _BRAND_REMOTE_SERVICE_: unique symbol = Symbol('_REMOTE_SERVICE_');

export const _BRAND_SERVICE_CLIENT_BASE_: unique symbol = Symbol('_BRAND_SERVICE_CLIENT_BASE_');
export const _BRAND_SERVICE_CLIENT_: unique symbol = Symbol('_BRAND_SERVICE_CLIENT_');
export const _BRAND_REMOTE_SERVICE_CLIENT_: unique symbol = Symbol('_BRAND_REMOTE_SERVICE_CLIENT_');

// provider brands
export const _BRAND_ACTION_EXECUTER_: unique symbol = Symbol('_BRAND_ACTION_EXECUTER_');
export const _BRAND_ACTION_CLIENT_: unique symbol = Symbol('_BRAND_ACTION_CLIENT_');
export const _BRAND_REMOTE_ACTION_EXECUTER_: unique symbol = Symbol(
  '_BRAND_REMOTE_ACTION_EXECUTER_',
);
export const _BRAND_REMOTE_ACTION_CLIENT_: unique symbol = Symbol('_BRAND_REMOTE_ACTION_CLIENT_');

export const _BRAND_REACTIVE_STATE_: unique symbol = Symbol('_BRAND_REACTIVE_STATE_');
export const _BRAND_REACTIVE_STATE_CLIENT_: unique symbol = Symbol('_BRAND_REACTIVE_STATE_CLIENT_');
export const _BRAND_REMOTE_STATE_: unique symbol = Symbol('_BRAND_REMOTE_STATE_');
export const _BRAND_REMOTE_STATE_CLIENT_: unique symbol = Symbol('_BRAND_REMOTE_STATE_CLIENT_');

export const _BRAND_EVENT_EMITTER_: unique symbol = Symbol('_BRAND_EVENT_EMITTER_');
export const _BRAND_EVENT_CLIENT_: unique symbol = Symbol('_BRAND_EVENT_CLIENT_');

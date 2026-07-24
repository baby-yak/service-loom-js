//-------------------------------------------------------
//-- Providers
//-------------------------------------------------------

export interface ActionsProvider<C = any> {
  readonly invoke: C; // ← right name
}
export interface StateProvider<C = any> {
  readonly client: C;
}
export interface EventsProvider<C = any> {
  readonly client: C;
}

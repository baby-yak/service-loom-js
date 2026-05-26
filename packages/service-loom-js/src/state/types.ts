import type { RawStateClient } from './rawStateClient.js';
import type { RawStateProvider } from './rawStateProvider.js';

export type InferState<T extends RawStateProvider<unknown> | RawStateClient<unknown>> =
  T extends RawStateProvider<infer S>
    ? S // RawStateProvider <S> ---> infer S
    : T extends RawStateClient<infer S>
      ? S // RawStateClient <S> ---> infer S
      : never;

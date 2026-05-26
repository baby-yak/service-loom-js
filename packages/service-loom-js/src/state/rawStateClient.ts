/**
 * a general StateClient interface.
 */
export interface RawStateClient<S> {
  //just make S generic be enforced by the type system:
  [NOOP]?: S;
}

const NOOP = Symbol('NOOP');

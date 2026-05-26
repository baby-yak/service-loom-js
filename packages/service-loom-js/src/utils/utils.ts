export function delay(timeout: number) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

export function delayResolve<T = any>(timeout: number, result: T) {
  return new Promise<T>((resolve) =>
    setTimeout(() => {
      resolve(result);
    }, timeout),
  );
}

export function delayReject<T = any>(timeout: number, error: Error) {
  return new Promise<T>((resolve, reject) =>
    setTimeout(() => {
      reject(error);
    }, timeout),
  );
}

export function createControlledPromise<T = void>() {
  let resolve: (value: T) => void = () => {};
  let reject: (error?: Error | string) => void = () => {};

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = (error?: Error | string) => {
      if (error === undefined) error = new Error();
      if (typeof error === 'string') error = new Error(error);
      _reject(error);
    };
  });

  return {
    promise,
    resolve,
    reject,
  };
}

export function targetIs(target: unknown, markerSymbol: symbol) {
  return typeof target === 'object' && target != null && markerSymbol in target;
}

export function createDebugLogger(enabled: boolean): Console {
  return new Proxy(
    {},
    {
      get(target, p) {
        if (!enabled) {
          return () => {};
        }
        return console[p as keyof typeof console];
      },
    },
  ) as Console;
}

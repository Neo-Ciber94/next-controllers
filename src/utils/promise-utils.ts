import { isPromise } from '.';

export namespace PromiseUtils {
  export function timeout<T = void>(ms: number, f: () => T | Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new TimeoutError(`Timeout after ${ms}ms`)), ms);
      const result = f();

      if (isPromise(result)) {
        result
          .then(resolve)
          .catch(reject)
          .finally(() => clearTimeout(timer));
      }
    });
  }
}

export class TimeoutError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

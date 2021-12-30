import { isPromise } from '.';

export namespace PromiseUtils {
  export function timeout<T = void>(ms: number, f: () => T | Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new TimeoutError(`Timeout after ${ms}ms`)), ms);
      const result = f();

      if (isPromise(result)) {
        result
          .then((x) => {
            clearTimeout(timer);
            resolve(x);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err);
          });
      }
    });
  }
}

export class TimeoutError extends Error {
  constructor(public message: string) {
    super(message);
  }
}

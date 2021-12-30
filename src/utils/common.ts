export function assertTrue(condition: unknown, message?: string): asserts condition {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

export function isPromise<T = unknown>(value: any): value is Promise<T> {
  return value && typeof value.then === 'function' && typeof value.catch === 'function';
}

export function isPromiseLike<T = unknown>(value: any): value is PromiseLike<T> {
  return value && typeof value.then === 'function';
}

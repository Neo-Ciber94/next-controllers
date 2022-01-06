export function assertTrue(condition: unknown, message = 'Assertion failed'): condition is true {
  if (!condition) {
    throw new Error(message);
  }

  return true;
}

export function getValueOrArray<T>(obj: T | T[]): T[] {
  if (Array.isArray(obj)) {
    return obj;
  } else {
    return [obj];
  }
}

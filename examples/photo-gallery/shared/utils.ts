export function assertTrue(condition: unknown, message = 'Assertion failed'): condition is true {
  if (!condition) {
    throw new Error(message);
  }

  return true;
}

export function repeat<T>(value: T | Array<T>, count: number): T[] {
  assertTrue(count >= 0, 'count must be >= 0');

  if (count === 0) {
    return [];
  }

  const result: T[] = [];

  if (Array.isArray(value)) {
    for (let i = 0; i < count; i++) {
      result.push(...value);
    }
  } else {
    for (let i = 0; i < count; i++) {
      result.push(value);
    }
  }

  return result;
}

export function repeatClone<T>(value: T | Array<T>, count: number): T[] {
  assertTrue(count >= 0, 'count must be >= 0');

  if (count === 0) {
    return [];
  }

  const result: T[] = [];

  if (Array.isArray(value)) {
    for (let i = 0; i < count; i++) {
      result.push(...clone(value));
    }
  } else {
    for (let i = 0; i < count; i++) {
      result.push(clone(value));
    }
  }

  return result;
}

export function clone<T>(obj: T): T {
  if (Array.isArray(obj)) {
    const result: T[] = [];
    obj.forEach((item) => result.push(clone(item)));
    return result as any as T;
  } else {
    return Object.assign({}, obj);
  }
}

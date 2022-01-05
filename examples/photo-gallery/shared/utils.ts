export function assertTrue(condition: unknown, message = 'Assertion failed'): condition is true {
  if (!condition) {
    throw new Error(message);
  }

  return true;
}
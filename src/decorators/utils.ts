// @internal
export function getString(s: string | symbol): string {
  if (typeof s === 'symbol') {
    return s.description || '';
  }

  return s;
}

/**
 * Fetch json data from an url.
 * @param url The url to fetch.
 * @param init The init object to pass to the fetch function.
 * @returns The data returned from the fetch.
 */
export function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  return fetch(url, init).then((res) => res.json());
}

/**
 * Converts a string to PascalCase.
 * @param str The string to convert to PascalCase.
 * @returns The string converted to PascalCase.
 */
export function toPascalCase(str: string): string {
  // https://stackoverflow.com/a/4068586/9307869
  return str.replace(/(\w)(\w*)/g, (_, c1, c2) => c1.toUpperCase() + c2.toLowerCase());
}

/**
 * A value that can be expresed as milliseconds.
 */
export type AsMilliseconds = number | `${number}ms` | `${number}s`;

/**
 * Converts a string to milliseconds.
 * @param str The string to convert to milliseconds.
 * @returns The string converted to milliseconds.
 */
export function toMilliseconds(str: AsMilliseconds): number {
  if (typeof str === 'number') {
    return str;
  }

  const match = str.match(/^(\d+(\.\d+?)?)(ms|s)$/);
  if (match === null) {
    throw new Error(`Invalid time string: ${str}`);
  }

  const [, value, unit] = match;
  const valueNum = Number(value);

  if (isNaN(valueNum)) {
    throw new Error(`Invalid time string: ${str}`);
  }

  if (unit === 'ms') {
    return valueNum;
  }

  return valueNum * 1000;
}
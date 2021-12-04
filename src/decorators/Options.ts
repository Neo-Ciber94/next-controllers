import { getMetadataStorage } from '../core/getMetadataStorage';

/**
 * Register a handler for 'OPTIONS' requests.
 * @param pattern Pattern for matching the route.
 */
export function Options(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'OPTIONS',
      methodName,
    });
  };
}

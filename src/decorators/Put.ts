import { getMetadataStorage } from '../core/getMetadataStorage';

/**
 * Register a handler for 'PUT' requests.
 * @param pattern Pattern for matching the route.
 */
export function Put(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'PUT',
      methodName,
    });
  };
}

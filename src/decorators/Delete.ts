import { getMetadataStorage } from '../core/getMetadataStorage';

/**
 * Register a handler for 'DELETE' requests.
 * @param pattern Pattern for matching the route.
 */
export function Delete(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'DELETE',
      methodName,
    });
  };
}

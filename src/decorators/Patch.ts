import { getMetadataStorage } from '../core/getMetadataStorage';

/**
 * Register a handler for 'PATCH' requests.
 * @param pattern Pattern for matching the route.
 */
export function Patch(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'PATCH',
      methodName,
    });
  };
}

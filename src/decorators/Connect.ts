import { getMetadataStorage } from '../core/getMetadataStorage';

/**
 * Register a handler for 'CONNECT' requests.
 * @param pattern Pattern for matching the route.
 */
export function Connect(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'CONNECT',
      methodName,
    });
  };
}

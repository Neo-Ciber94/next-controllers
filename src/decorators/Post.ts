import { getMetadataStorage, getString } from '..';

/**
 * Register a handler for 'POST' requests.
 * @param pattern Pattern for matching the route.
 */
export function Post(pattern?: string | RegExp): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const methodName = getString(propertyKey);
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'POST',
      methodName,
    });
  };
}

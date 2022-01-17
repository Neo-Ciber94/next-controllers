import { getMetadataStorage, getString } from '..';

/**
 * Register a handler for 'PUT' requests.
 * @param pattern Pattern for matching the route.
 */
export function Put(pattern?: string | RegExp): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const methodName = getString(propertyKey);
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'PUT',
      methodName,
    });
  };
}

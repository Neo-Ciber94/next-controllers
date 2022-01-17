import { getMetadataStorage, getString } from '..';

/**
 * Register a handler for request in all HTTP methods.
 *
 * @remarks In case of conflict with other handler, `All` will have the lowest priority.
 * @param pattern Pattern for matching the route.
 */
export function All(pattern?: string | RegExp): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const methodName = getString(propertyKey);
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: 'ALL',
      methodName,
    });
  };
}

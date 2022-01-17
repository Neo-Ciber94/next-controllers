import { getMetadataStorage, getString } from '..';

/**
 * Register a handler that run before each request.
 */
export function BeforeRequest(): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const methodName = getString(propertyKey);
    getMetadataStorage().addBeforeRequest({
      target: target.constructor,
      methodName,
    });
  };
}

import { getMetadataStorage, getString } from '..';

/**
 * Register a handler that run after each request.
 */
export function AfterRequest(): MethodDecorator {
  return (target: any, propertyKey: string | symbol) => {
    const methodName = getString(propertyKey);
    getMetadataStorage().addAfterRequest({
      target: target.constructor,
      methodName,
    });
  };
}

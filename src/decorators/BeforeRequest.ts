import { getMetadataStorage, getString } from '..';

/**
 * Register a handler that run before each request.
 * The handler is not run if an error occur and should not modify the response of the context.
 *
 * The handler could have the form:
 * ```
 * beforeRequest(context: HttpContext): void | Promise<void>;
 * ```
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

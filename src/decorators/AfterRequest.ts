import { getMetadataStorage, getString } from '..';

/**
 * Register a handler that run after each request.
 * This handler should not after the response of the context.
 *
 * The handler could have the form:
 * ```
 * afterRequest(context: HttpContext): void | Promise<void>;
 * ```
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

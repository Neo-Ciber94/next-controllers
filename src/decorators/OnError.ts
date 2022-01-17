import { getMetadataStorage, getString } from '..';

/**
 * Register a method that handles errors in the form:
 * ```
 * (err: unknown, context: NextApiContext) => void
 * ```
 */
export function OnError(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const methodName = getString(propertyKey);
    getMetadataStorage().addErrorHandler({
      target: target.constructor,
      methodName,
    });
  };
}

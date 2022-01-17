import { getMetadataStorage, getString } from '..';

/**
 * Register a method that handles request that don't match any route.
 *
 * In the form:
 * ```
 * (context: NextApiContext) => void
 * ```
 */
export function OnNoMatch(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const methodName = getString(propertyKey);
    getMetadataStorage().addNoMatchHandler({
      target: target.constructor,
      methodName,
    });
  };
}

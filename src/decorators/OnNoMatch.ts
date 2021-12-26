import { getMetadataStorage } from '..';

/**
 * Register a method that handles request that don't match any route.
 * 
 * In the form:
 * ```
 * (context: NextApiContext) => void
 * ```
 */
export function OnNoMatch() {
  return function (target: any, methodName: string) {
    getMetadataStorage().addNoMatchHandler({
      target: target.constructor,
      methodName,
    });
  };
}

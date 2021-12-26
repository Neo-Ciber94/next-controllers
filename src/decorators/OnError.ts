import { getMetadataStorage } from '..';

/**
 * Register a method that handles errors in the form:
 * ```
 * (err: unknown, context: NextApiContext) => void
 * ```
 */
export function OnError() {
  return function (target: any, methodName: string) {
    getMetadataStorage().addErrorHandler({
      target: target.constructor,
      methodName,
    });
  };
}

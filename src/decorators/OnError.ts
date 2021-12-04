import { getMetadataStorage, ObjectType } from '..';

/**
 * Register a method that handles errors in the form:
 * ```
 * (err: any, req: NextApiRequest, res: NextApiRespose, next: (error?: any) => void) => void
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

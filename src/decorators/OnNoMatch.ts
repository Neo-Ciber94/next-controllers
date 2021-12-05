import { getMetadataStorage } from '..';

/**
 * Register a method that handles request that don't match any route.
 * ```
 * (err: any, req: NextApiRequest, res: NextApiRespose, next: (error?: any) => void) => void
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

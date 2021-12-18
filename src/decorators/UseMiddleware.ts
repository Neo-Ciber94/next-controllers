import { getMetadataStorage, Middleware, ErrorMiddleware, MiddlewareHandler } from '..';

/**
 * Register a middleware or collection of middlewares for a given route or controller.
 * @param middlewares The middlewares to register.
 */
export function UseMiddleware<Req, Res>(...middlewares: Middleware<Req, Res>[]): any;

/**
 * Register a middleware or collection of middlewares for a given route or controller.
 * @param middlewares The middlewares to register.
 */
export function UseMiddleware<Req, Res>(...middlewares: ErrorMiddleware<Req, Res>[]): any;

/**
 * Register a middleware or collection of middlewares for a given route or controller.
 * @param middlewares The middlewares to register.
 */
export function UseMiddleware<Req, Res>(...middlewares: MiddlewareHandler<Req, Res>[]) {
  return function (target: any, methodName?: string) {
    middlewares.forEach((handler) => {
      // If the target is no a method but a class, methodName will be undefined
      if (methodName) {
        getMetadataStorage().addMiddleware({
          target: target.constructor,
          methodName,
          handler,
        });
      } else {
        getMetadataStorage().addMiddleware({
          target,
          handler,
        });
      }
    });
  };
}

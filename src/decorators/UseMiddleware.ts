import { getMetadataStorage, Middleware, ErrorMiddleware, MiddlewareHandler } from '..';

/**
 * Register a middleware or collection of middlewares for a given route or controller.
 * @param middlewares The middlewares to register.
 */
export function UseMiddleware<Req, Res>(...middlewares: Middleware<Req, Res>[]): MethodDecorator;

/**
 * Register a middleware or collection of middlewares for a given route or controller.
 * @param middlewares The middlewares to register.
 */
export function UseMiddleware<Req, Res>(...middlewares: ErrorMiddleware<Req, Res>[]): MethodDecorator;

/**
 * Register a middleware or collection of middlewares for a given route or controller.
 * @param middlewares The middlewares to register.
 */
export function UseMiddleware<Req, Res>(...middlewares: MiddlewareHandler<Req, Res>[]): MethodDecorator {
  return function (target: any, propertyKey?: string | symbol) {
    const methodName = propertyKey ? propertyKey.toString() : undefined;
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

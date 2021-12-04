import { getMetadataStorage, Middleware } from '..';

/**
 * Register a middleware or collection of middlewares for a given route or controller.
 * @param middlewares The middlewares to register.
 */
// prettier-ignore
export function UseMiddleware<Req, Res>(middlewares: Middleware<Req, Res> | Middleware<Req, Res>[]) {
  return function (target: any, methodName?: string) {
    if (Array.isArray(middlewares)) {
      middlewares.forEach((m) => addMiddlewareToStorage(target, methodName, m));
    } else {
      addMiddlewareToStorage(target, methodName, middlewares);
    }
  };
}

// prettier-ignore
function addMiddlewareToStorage(target: any, methodName: string | undefined, handler: Middleware<any, any>) {
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
}

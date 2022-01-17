import { ServerResponse } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import {
  ErrorHandler,
  getMetadataStorage,
  Handler,
  ActionMethod,
  NextApiRequestWithParams,
  ObjectType,
  Middleware,
  DEFAULT_CONTROLLER_CONFIG,
  RouteControllerConfig,
  HttpContext,
  RoutePath,
  MiddlewareHandler,
  ErrorMiddleware,
} from '.';
import { ErrorHandlerInterface } from './interfaces/error-handler';
import { assertTrue, getFrames, HTTP_STATUS_CODES, PromiseUtils, Results, TimeoutError } from './utils';

const MIDDLEWARE_TIMEOUT = 5000;

type ContextApiHandler<Req, Res> = (context: HttpContext<any, Req, Res>) => any | Promise<any>;

type ApiHandler<Req, Res> = (req: Req, res: Res) => Promise<any>;

interface ControllerRoute<Req, Res> {
  path: RoutePath;
  method: ActionMethod;
  handler: Handler<Req, Res>;
  middlewares: MiddlewareHandler<Req, Res>[];
}

/**
 * Configuration for `withController`
 */
export interface WithControllerOptions {
  /**
   * Current path of this route, this value should be set to nodejs `__dirname`.
   *
   * @example
   * ```ts
   * import { withController } from 'next-controllers'
   *
   * class MyController {}
   *
   * export default withController(MyController, { dirname: __dirname })
   * ```
   */
  dirname?: string;

  /**
   * Whether to decode the query params of the request.
   * The default is `true`.
   */
  decodeQueryParams?: boolean;

  /**
   * Timeout for the middlewares. Default is 5 seconds.
   *
   * This time is used to check if the middleware don't called `next()`
   * and return the control to NextJS, this timeout doesn't prevent
   * a stalled request.
   */
  middlewareTimeout?: number | null;
}

/**
 * Creates a request handler using the specified controller.
 * @param target The controller class to use.
 * @param route The route of the controller, the route path will resolve to: `/api/${basePath}`.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, route?: string): ApiHandler<Req, Res>;

/**
 * Creates a request handler using the specified controller.
 * @param target The controller class to use.
 * @param options Configuration options for the controller.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, options: WithControllerOptions): ApiHandler<Req, Res>;

/**
 * Creates a request handler using the specified controller.
 * @param target The controller class to use.
 * @param optionsOrRoute Either the configuration options for the controller or route.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, optionsOrRoute?: string | WithControllerOptions): ApiHandler<Req, Res> {
  const basePath = getBasePath(optionsOrRoute);
  const controller = new target();
  const controllerRoutes: ControllerRoute<Req, Res>[] = [];
  const metadataStore = getMetadataStorage();
  const actions = metadataStore.getActions(target);
  const allMiddlewares = metadataStore.getMiddlewares(target);
  const controllerMiddlewares = allMiddlewares.filter((m) => m.methodName == null).map((m) => m.handler);
  let shouldDecodeQueryParams = false;

  // `withController` options
  const opts = optionsOrEmpty(optionsOrRoute);
  shouldDecodeQueryParams = opts.decodeQueryParams === undefined || opts.decodeQueryParams === true;

  // prettier-ignore
  const controllerConfig = metadataStore.getController(target)?.config || DEFAULT_CONTROLLER_CONFIG;
  const httpContextMetadata = metadataStore.getContext(target);
  const stateOrPromise = controllerConfig.state || {};
  let contextState: any = controllerConfig.state || {};

  // prettier-ignore
  // Binds the 'onError' callback
  const errorHandlerMetadata = metadataStore.getErrorHandler(target);
  const errorHandler = errorHandlerMetadata ? controller[errorHandlerMetadata.methodName] : null;

  const onNoMatchMetadata = metadataStore.getNoMatchHandler(target);
  const noMatchHandler = onNoMatchMetadata ? controller[onNoMatchMetadata.methodName] : null;

  const beforeRequestMetadata = metadataStore.getBeforeRequest(target);
  const beforeRequestHandler = beforeRequestMetadata ? controller[beforeRequestMetadata.methodName] : null;

  const afterRequestMetadata = metadataStore.getAfterRequest(target);
  const afterRequestHandler = afterRequestMetadata ? controller[afterRequestMetadata.methodName] : null;

  // Error handler for the controller
  let controllerOnError: ErrorHandler<Req, Res> | undefined;

  if (controllerConfig.onError) {
    if (typeof controllerConfig.onError === 'function') {
      controllerOnError = controllerConfig.onError;
    } else {
      controllerOnError = (controllerConfig.onError as ErrorHandlerInterface<any, Req, Res>).onError;
    }
  }

  // prettier-ignore
  const _onError = (controllerOnError || errorHandler?.bind(controller) || defaultOnError) as ErrorHandler<Req, Res>;
  const _onNoMatch = (noMatchHandler?.bind(controller) || defaultOnNoMatch) as ContextApiHandler<Req, Res>;

  const onError: ErrorHandler<Req, Res> = async (err, context) => {
    const result = await _onError(err, context);
    return await sendResponse(context.response, controllerConfig, result);
  };

  const onNoMatch: ContextApiHandler<Req, Res> = async (context) => {
    const result = await _onNoMatch(context);
    return await sendResponse(context.response, controllerConfig, result);
  };

  // Register all the routes of this controller
  for (const action of actions) {
    const pattern: string | RegExp = action.pattern || '/';

    if (typeof pattern === 'string' && !pattern.toString().startsWith('/')) {
      throw new Error(`Route pattern must start with "/": ${pattern}`);
    }

    const routeMiddlewares = allMiddlewares
      .filter((m) => m.methodName && m.methodName === action.methodName)
      .map((m) => m.handler);

    const method = controller[action.methodName] as Handler<Req, Res>;
    assertTrue(method != null, `Method ${action.methodName} not found`);

    controllerRoutes.push({
      path: new RoutePath(pattern as any), // FIXME: Typescript is not detecting string|RegExp
      method: action.method,
      handler: method.bind(controller),
      middlewares: routeMiddlewares,
    });
  }

  // Returns a handler to the request
  return async function (req: Req, res: Res) {
    // Initialize `HttpContext` state
    if (typeof stateOrPromise === 'function') {
      contextState = await stateOrPromise();
    } else {
      contextState = await stateOrPromise;
    }

    // HttpContext for the current request
    const httpContext = new HttpContext(contextState, req, res);
    let requestUrl = req.url || '/';

    // Ignore the query params
    const queryParamsIdx = requestUrl.indexOf('?');
    if (queryParamsIdx > 0) {
      requestUrl = requestUrl.substring(0, queryParamsIdx);
    }

    // Decode the query params
    if (shouldDecodeQueryParams) {
      decodeQueryParams(req);
    }

    if (!requestUrl.startsWith(basePath)) {
      return onNoMatch(httpContext);
    }

    // Inject the context
    for (const context of httpContextMetadata) {
      controller[context.propertyName] = httpContext;
    }

    // Slice the base path
    let url = requestUrl.slice(basePath.length);

    // Ensures the url starts with a slash
    if (!url.startsWith('/')) {
      url = '/' + url;
    }

    // Finds the route this request is going to, and attach the request params
    const route = findRoute(url, req, controllerRoutes);

    // No route match
    if (route == null) {
      return onNoMatch(httpContext);
    }

    try {
      // Run the controller middlewares
      if ((await runMiddlewares(opts, req, res, controllerMiddlewares)) === false || isResEnded(res)) {
        return;
      }

      // Run the route middlewares
      if ((await runMiddlewares(opts, req, res, route.middlewares)) === false || isResEnded(res)) {
        return;
      }

      // Before request
      if (beforeRequestHandler) {
        await beforeRequestHandler(httpContext);
      }

      // Get and returns the route response
      const routeResult = await route.handler(httpContext);
      await sendResponse(httpContext.response, controllerConfig, routeResult);

      // After request
      if (afterRequestHandler) {
        await afterRequestHandler(httpContext);
      }
    } catch (error) {
      // Handle the error
      const errorResult = await onError(error, httpContext);
      return await sendResponse(httpContext.response, controllerConfig, errorResult);
    }
  };
}

function findRoute<Req extends NextApiRequestWithParams>(
  url: string,
  req: Req,
  routes: ControllerRoute<any, any>[],
): ControllerRoute<any, any> | null {
  let resultRoute: ControllerRoute<any, any> | null = null;

  for (const route of routes) {
    const matches = route.path.match(url);

    if ((route.method === 'ALL' || route.method === req.method) && matches) {
      // Action method 'ALL' have the lowest priority
      if (resultRoute && route.method === 'ALL' && resultRoute.method !== route.method) {
        continue;
      }

      // Attach params
      req.params = matches;

      // Sets matching route
      resultRoute = route;
    }
  }

  return resultRoute;
}

async function sendResponse<Res extends NextApiResponse>(response: Res, config: RouteControllerConfig, value: unknown) {
  // A response was already written
  if (isResEnded(response)) {
    return;
  }

  if (value === null) {
    return response.status(config.statusCodeOnNull).end();
  }

  if (value === undefined) {
    return response.status(config.statusCodeOnUndefined).end();
  }

  if (value instanceof Results) {
    return await value.resolve(response);
  }

  if (typeof value === 'object' || Array.isArray(value)) {
    return response.json(value);
  }

  return response.send(value);
}

function defaultOnError<Req extends NextApiRequestWithParams, Res extends NextApiResponse>(
  err: any,
  { response }: HttpContext<any, Req, Res>,
) {
  // eslint-disable-next-line no-console
  console.error(err);

  response.status(500).json({
    message: err.message || HTTP_STATUS_CODES[500],
  });
}

function defaultOnNoMatch<Req extends NextApiRequestWithParams, Res extends NextApiResponse>(
  context: HttpContext<any, Req, Res>,
) {
  context.response.status(404).json({
    message: HTTP_STATUS_CODES[404],
  });
}

function getBasePath(options?: string | WithControllerOptions) {
  options = options == null ? {} : options;

  if (typeof options === 'string') {
    assertTrue(options == '' || options.startsWith('/'), `Base path must start with "/": ${options}`);
    return `/api${options}`;
  }

  const stringPath = options.dirname || getDirName();
  const dirname = path.normalize(stringPath);
  const segments = dirname.split(path.sep);
  const apiIdx = segments.indexOf('api');

  if (apiIdx === -1) {
    // If the current file is named "index" the folder "api/" may be omitted
    if (segments[segments.length - 1] === 'pages') {
      return '/api';
    }

    throw new Error(`Can not find "api/" folder: ${dirname}`);
  }

  return '/' + segments.slice(apiIdx).join('/');
}

function getDirName(): string {
  const frames = getFrames();

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    // The previous frame before the `withController` call
    // is where the route controller is defined
    if (frame.methodName === withController.name) {
      if (i === 0) {
        break;
      }

      const prevFrame = frames[i - 1];
      const dirName = path.dirname(prevFrame.file || '');
      return dirName;
    }
  }

  // eslint-disable-next-line no-console
  console.error('Cannot find controller file path');
  return '';
}

function decodeQueryParams(req: NextApiRequest) {
  if (req.query) {
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') {
        req.query[key] = decodeURIComponent(value);
      } else if (Array.isArray(value)) {
        req.query[key] = value.map(decodeURIComponent);
      }
    }
  }
}

/// This returns `true` if can continue and `false` or an error if cannot continue.
function runMiddlewares(
  options: WithControllerOptions,
  req: any,
  res: any,
  middlewares: MiddlewareHandler<any, any>[],
): Promise<boolean> {
  if (middlewares.length === 0) {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    handle(options, req, res, middlewares, (result) =>
      typeof result === 'boolean' ? resolve(result) : reject(result.error),
    );
  });
}

type DoneHandler = (result: boolean | { error: any }) => void;

// Run the actual middlewares
function handle(
  options: WithControllerOptions,
  req: any,
  res: any,
  middlewares: MiddlewareHandler<any, any>[],
  done: DoneHandler,
) {
  const timeout = options.middlewareTimeout === undefined ? MIDDLEWARE_TIMEOUT : options.middlewareTimeout;
  let index = 0;

  async function next(error?: any) {
    if (index === middlewares.length) {
      return done(error ? { error } : true);
    }

    const middleware = wrapMiddleware(middlewares[index++]);

    try {
      // We timeout the middleware execution to give NextJS the control when timeout
      if (timeout != null) {
        await PromiseUtils.timeout(timeout, () => middleware(error, req, res, next));
      } else {
        await middleware(error, req, res, next);
      }
    } catch (e) {
      if (e instanceof TimeoutError) {
        done(false);
      } else {
        await next(e);
      }
    }
  }

  next();
}

// Wraps the middleware into a error middleware, just for simplicity
function wrapMiddleware(middleware: MiddlewareHandler<any, any>): ErrorMiddleware<any, any> {
  return async (error, req, res, next) => {
    /* prettier-ignore */
    if (error && middleware.length === 4) {
      await middleware(error, req, res, next);
    } 
    else {
      if (middleware.length === 4) {
        await middleware(undefined, req, res, next);
      } 
      else {
        await (middleware as Middleware<any, any>)(req, res, next);
      }
    }
  };
}

function optionsOrEmpty(config?: WithControllerOptions | string): WithControllerOptions {
  return config == null || typeof config === 'string' ? {} : config;
}

function isResEnded(res: ServerResponse) {
  return res.writableEnded || res.writableFinished;
}

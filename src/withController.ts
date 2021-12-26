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
import { assertTrue, getStackFrame, HTTP_STATUS_CODES, Results } from './utils';

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
}

/**
 * Creates a request handler using the specified controller.
 * @param target The controller class to use.
 * @param basePath The base path of the controller, the route path will resolve to: `/api/${basePath}`.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, basePath?: string): ApiHandler<Req, Res>;

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
 * @param options Either the configuration options for the controller or the base path.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, options?: string | WithControllerOptions): ApiHandler<Req, Res> {
  const basePath = getBasePath(options);
  const controller = new target();
  const controllerRoutes: ControllerRoute<Req, Res>[] = [];
  const metadataStore = getMetadataStorage();
  const actions = metadataStore.getActions(target);
  const allMiddlewares = metadataStore.getMiddlewares(target);
  const controllerMiddlewares = allMiddlewares.filter((m) => m.methodName == null).map((m) => m.handler);
  let shouldDecodeQueryParams = false;

  if (typeof options === 'object') {
    shouldDecodeQueryParams = options.decodeQueryParams === undefined || options.decodeQueryParams === true;
  }

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
      /* prettier-ignore */
      // Run the controller middlewares
      if ((await runMiddlewares(req, res, controllerMiddlewares)) === false || res.writableEnded || res.writableFinished) {
        return;
      }

      // Run the route middlewares
      if ((await runMiddlewares(req, res, route.middlewares)) === false || res.writableEnded || res.writableFinished) {
        return;
      }

      // Get and returns the route response
      const routeResult = await route.handler(httpContext);
      return await sendResponse(httpContext.response, controllerConfig, routeResult);
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
  if (response.writableEnded || response.writableFinished) {
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
    return `/api/${options}`;
  }

  const dirname = options.dirname || getDirName();
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
  // return _dirname; // FIXME: This should be returned but is returning the node_module

  const frame = getStackFrame(1);
  const dirname = path.dirname(frame.file || '');
  return dirname;
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
function runMiddlewares(req: any, res: any, middlewares: MiddlewareHandler<any, any>[]): Promise<boolean> {
  if (middlewares.length === 0) {
    return Promise.resolve(true);
  }

  return new Promise((resolve, reject) => {
    handle(req, res, middlewares, (result) => (typeof result === 'boolean' ? resolve(result) : reject(result.error)));
  });
}

type DoneHandler = (result: boolean | { error: any }) => void;

// Run the actual middlewares
function handle(req: any, res: any, middlewares: MiddlewareHandler<any, any>[], done: DoneHandler) {
  let index = 0;
  async function next(error?: any) {
    if (index === middlewares.length) {
      return done(error ? { error } : true);
    }

    const middleware = wrapMiddleware(middlewares[index++]);
    const lastIndex = index;

    try {
      await middleware(error, req, res, next);
    } catch (e) {
      await next(e);
    }

    // If the middleware has not called next, exits the loop
    if (lastIndex === index) {
      return done(false);
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

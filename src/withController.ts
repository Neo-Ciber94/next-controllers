import { NextApiRequest, NextApiResponse } from 'next';
import path from 'path';
import {
  ErrorHandler,
  getMetadataStorage,
  Handler,
  ActionType,
  NextApiRequestWithParams,
  NextHandler,
  ObjectType,
  Middleware,
  DEFAULT_CONTROLLER_CONFIG,
  RouteControllerConfig,
  HttpContext,
  RoutePath,
  MiddlewareHandler,
} from '.';
import { ErrorHandlerInterface } from './interfaces/error-handler';
import { getStackFrame, HTTP_STATUS_CODES, Results } from './utils';

type NoReturnHandler<Req, Res> = (context: HttpContext<any, Req, Res>) => void | Promise<void>;

type NextControllerApiHandler<Req, Res> = (req: Req, res: Res) => Promise<any>;

interface ControllerRoute<Req, Res> {
  path: RoutePath;
  method: ActionType;
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
>(target: ObjectType<any>, basePath?: string): NextControllerApiHandler<Req, Res>;

/**
 * Creates a request handler using the specified controller.
 * @param target The controller class to use.
 * @param options Configuration options for the controller.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, options: WithControllerOptions): NextControllerApiHandler<Req, Res>;

/**
 * Creates a request handler using the specified controller.
 * @param target The controller class to use.
 * @param options Either the configuration options for the controller or the base path.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, options?: string | WithControllerOptions): NextControllerApiHandler<Req, Res> {
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
  const _onNoMatch = (noMatchHandler?.bind(controller) || defaultOnNoMatch) as NoReturnHandler<Req, Res>;

  const onError: ErrorHandler<Req, Res> = async (err, context) => {
    const result = await _onError(err, context);
    return await sendResponse(context.response, controllerConfig, result);
  };

  const onNoMatch: NoReturnHandler<Req, Res> = async (context) => {
    const result = await _onNoMatch(context);
    return await sendResponse(context.response, controllerConfig, result);
  };

  // Register all the routes of this controller
  for (const action of actions) {
    const pattern: string | RegExp = action.pattern || '/';

    if (!pattern.toString().startsWith('/')) {
      throw new Error(`Route pattern must start with "/": ${pattern}`);
    }

    const routeMiddlewares = allMiddlewares
      .filter((m) => m.methodName && m.methodName === action.methodName)
      .map((m) => m.handler);

    // prettier-ignore
    const method = controller[action.methodName] as Handler<Req, Res>;
    // eslint-disable-next-line no-console
    console.assert(method != null, `Method ${action.methodName} not found`);

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

    // Slice the base path
    const url = requestUrl.slice(basePath.length);

    // An error capture by the controller
    let error: any;

    // Inject the context
    for (const context of httpContextMetadata) {
      controller[context.propertyName] = httpContext;
    }

    // Finds the route this request is going to, and attach the request params
    const route = findRoute(url, req, controllerRoutes);

    // No route match
    if (route == null) {
      return onNoMatch(httpContext);
    }

    // Run all the middlewares of this controller
    const result = await runMiddlewares(undefined, req, res, controllerMiddlewares);

    if (typeof result !== 'boolean') {
      error = result.error;
    }

    // The middleware did not continue or the response was already written
    if (result === false || res.writableEnded) {
      return;
    }

    // Only continue to the route if there is no errors
    if (error == null) {
      try {
        // Run this route middlewares
        const middlewareResult = await runMiddlewares(undefined, req, res, route.middlewares);

        if (typeof middlewareResult !== 'boolean') {
          error = middlewareResult.error;
        }

        // The middleware did not continue or the response was already written
        if (middlewareResult === false || res.writableEnded) {
          return;
        }

        // Get and returns the route response
        const result = await route.handler(httpContext);
        return await sendResponse(httpContext.response, controllerConfig, result);
      } catch (e) {
        error = e;
      }
    }

    // A response was already written
    if (res.writableEnded) {
      return;
    }

    if (error) {
      // Handle the error
      const errorResult = await onError(error, httpContext);
      return await sendResponse(httpContext.response, controllerConfig, errorResult);
    }

    // Fallback
    return onNoMatch(httpContext);
  };
}

function findRoute<Req extends NextApiRequestWithParams>(
  url: string,
  req: Req,
  routes: ControllerRoute<any, any>[],
): ControllerRoute<any, any> | null {
  for (const route of routes) {
    const matches = route.path.match(url);

    if ((route.method !== 'ALL' && route.method !== req.method) || !matches) {
      continue;
    }

    // Attach params
    req.params = matches;

    return route;
  }

  return null;
}

async function sendResponse<Res extends NextApiResponse>(response: Res, config: RouteControllerConfig, value: unknown) {
  // A response was already written
  if (response.writableEnded) {
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
  next: NextHandler,
) {
  // eslint-disable-next-line no-console
  console.error(err);

  response.status(500).json({
    message: err.message || HTTP_STATUS_CODES[500],
  });
  next();
}

function defaultOnNoMatch<Req extends NextApiRequestWithParams, Res extends NextApiResponse>(
  context: HttpContext<any, Req, Res>,
) {
  context.response.status(404).json({
    message: HTTP_STATUS_CODES[404],
  });
}

function getBasePath(options?: string | WithControllerOptions) {
  options = options || {};

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
async function runMiddlewares<Req, Res>(
  error: any,
  req: Req,
  res: Res,
  middlewares: MiddlewareHandler<any, any>[],
): Promise<boolean | { error: any }> {
  // If there is no middlewares, exit
  if (middlewares.length === 0) {
    return true;
  }

  let index = -1;

  const next = async (err?: any) => {
    index += 1;

    if (index > middlewares.length) {
      return true;
    }

    // Sets the error if any
    error = err;

    // Gets the next middleware
    const middleware = middlewares[index];
    const lastIndex = index;

    try {
      if (error) {
        if (middleware.length === 4) {
          await middleware(error, req, res, next);
        }
      } else {
        if (middleware.length === 4) {
          await middleware(error, req, res, next);
        } else {
          await (middleware as Middleware<any, any>)(req, res, next);
        }
      }
    } catch (err) {
      // Sets the error
      await next(err);
    }

    // Next was not called
    if (lastIndex === index) {
      return false;
    }

    return true;
  };

  // Calls the middlewares recursively
  if ((await next()) === false) {
    return false;
  }

  if (error != null) {
    return { error };
  }

  return true;
}

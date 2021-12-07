import { NextApiResponse } from 'next';
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
} from '.';
import { getStackFrame, HTTP_STATUS_CODES, Results } from './utils';

type NoReturnHandler<Req, Res> = (context: HttpContext<any, Req, Res>) => void | Promise<void>;

type NextControllerApiHandler<Req, Res> = (req: Req, res: Res) => Promise<any>;

interface ControllerRoute<Req, Res> {
  path: RoutePath;
  method: ActionType;
  handler: Handler<Req, Res>;
  middlewares: Middleware<Req, Res>[];
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

  // prettier-ignore
  const _onError = (errorHandler?.bind(controller) ?? defaultOnError) as ErrorHandler<Req, Res>;
  const _onNoMatch = (noMatchHandler?.bind(controller) ?? defaultOnNoMatch) as NoReturnHandler<Req, Res>;

  const onError: ErrorHandler<Req, Res> = async (err, context, next) => {
    const result = await _onError(err, context, next);
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
    const requestUrl = req.url || '/';

    if (!requestUrl.startsWith(basePath)) {
      return onNoMatch(httpContext);
    }

    // Slice the base path
    const url = requestUrl.slice(basePath.length);
    let done = false;
    let hasError = false;

    // The next action handler
    const next = (err?: any) => {
      done = true;

      // Check if there was an error to avoid overflow
      if (!hasError && err) {
        hasError = true;
        return onError(err, httpContext, next);
      }
    };

    // Run the middlewares
    async function runMiddlewares(middlewares: Middleware<Req, Res>[]) {
      for (const middleware of middlewares) {
        await middleware(req, res, next); // TODO: handle middlewares that takes 4 arguments like express

        if (!done) {
          return false;
        }
      }

      // Reset the state
      done = false;
      return true;
    }

    // Inject the context
    for (const context of httpContextMetadata) {
      controller[context.propertyName] = httpContext;
    }

    try {
      // Run all the middlewares of this controller
      if (!(await runMiddlewares(controllerMiddlewares))) {
        return;
      }
    } catch (err: any) {
      return next(err);
    }

    // A response was already written
    if (res.writableEnded) {
      return;
    }

    // Finds the route this request is going to
    const route = findRoute(url, req, controllerRoutes);

    if (route) {
      try {
        // Run this route middlewares
        if (!(await runMiddlewares(route.middlewares))) {
          return;
        }

        const result = await route.handler(httpContext);
        return await sendResponse(httpContext.response, controllerConfig, result);
      } catch (err: any) {
        return next(err);
      }
    }

    // Not found
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

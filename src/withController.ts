import { NextApiResponse } from 'next';
import getCallsites from './utils/callsite';
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
  Results,
  HttpContext,
  RoutePath,
  HTTP_STATUS_CODES,
} from '.';

interface ControllerRoute<Req, Res> {
  path: RoutePath;
  method: ActionType;
  handler: Handler<Req, Res>;
  middlewares: Middleware<Req, Res>[];
}

interface WithControllerOptions {
  basePath?: string;
}

/**
 * Creates a function from the given controller that handles the requests for this route.
 *
 * @param target The target type to create the route controller.
 * @returns A controller for this route.
 */
export function withController<
  Req extends NextApiRequestWithParams = NextApiRequestWithParams,
  Res extends NextApiResponse = NextApiResponse,
>(target: ObjectType<any>, options: WithControllerOptions = {}) {
  assertIsValidApiFileName();

  const basePath = options.basePath || getBasePath();
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

  // prettier-ignore
  const onError = (errorHandler?.bind(controller) ?? defaultErrorHandler) as ErrorHandler<Req, Res>;

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

    let url = req.url || '/';

    if (!url.startsWith(basePath)) {
      return;
    }

    // Slice the base path
    url = url.slice(basePath.length);

    // HttpContext for the current request
    const httpContext = new HttpContext(contextState, req, res);

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
        await middleware(req, res, next);

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
    const route = findRouteHandler(url, req, controllerRoutes);

    if (route) {
      try {
        // Run this route middlewares
        if (!(await runMiddlewares(route.middlewares))) {
          return;
        }

        return await handleRequest(route, controllerConfig, httpContext);
      } catch (err: any) {
        return next(err);
      }
    }

    // Not found
    return res.status(404).end();
  };
}

function findRouteHandler(
  url: string,
  req: NextApiRequestWithParams,
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

async function handleRequest<Req extends NextApiRequestWithParams, Res extends NextApiResponse>(
  route: ControllerRoute<Req, Res>,
  config: RouteControllerConfig,
  context: HttpContext<any, Req, Res>,
) {
  const result = await route.handler(context);

  // A response was already written
  if (context.response.writableEnded) {
    return;
  }

  if (result === null) {
    return context.response.status(config.statusCodeOnNull).end();
  }

  if (result === undefined) {
    return context.response.status(config.statusCodeOnUndefined).end();
  }

  if (result instanceof Results) {
    return await result.resolve(context.response);
  }

  if (typeof result === 'object' || Array.isArray(result)) {
    return context.response.json(result);
  }

  return context.response.send(result);
}

function defaultErrorHandler<Req extends NextApiRequestWithParams, Res extends NextApiResponse>(
  err: any,
  { response }: HttpContext<any, Req, Res>,
  next: NextHandler,
) {
  console.error(err);

  response.status(500).json({
    message: err.message || HTTP_STATUS_CODES[500],
  });
  next();
}

function getBasePath() {
  const dirname = getDirName().split(path.sep);

  const idx = dirname.indexOf('api');

  if (idx === -1) {
    throw new Error(`Could not find "api/" folder`);
  }

  return '/' + dirname.slice(idx).join('/');
}

// Check if the file is valid for an /api route.
// This cannot capture all the routes for errors, but it should be enough for most cases.
function assertIsValidApiFileName() {
  const fileName = getFileName();
  const pattern = /\[\[\.\.\.(.+)\]\]/g;

  if (!pattern.test(fileName)) {
    throw new Error(
      `Api endpoint filename must match the pattern "[[...params]]" to capture all request but was "${fileName}"`,
    );
  }
}

function getFileName() {
  // return path.basename(__filename, path.extname(__filename));

  const dirname = getDirName();
  return path.basename(dirname, path.extname(dirname));
}

function getDirName() {
  // return path.dirname(__filename);

  const callsites = getCallsites();
  const fileName = callsites[2].getFileName();
  console.log('FILENAME: ', fileName);

  if (!fileName) {
    throw new Error('Could not find current directory name');
  }

  return fileName;
}

function getCallerFile(depth: number = 1): any {
  const prepareStackTraceOrg = Error.prepareStackTrace;
  const err = new Error();

  Error.prepareStackTrace = (_, stack) => stack;

  const stack = err.stack as any;
  console.log('Stack: ', stack[depth]);

  Error.prepareStackTrace = prepareStackTraceOrg;

  return stack[depth].getFileName();
}

import { MiddlewareHandler, ObjectType } from './types';
import { ActionMethod } from './action-method';
import { RouteControllerConfig } from '..';

export interface ControllerMetadata {
  target: ObjectType<any>;
  config: RouteControllerConfig;
}

export interface ControllerMethodMetadata {
  target: ObjectType<any>;
  methodName: string;
}

export interface ControllerActionMetadata {
  target: ObjectType<any>;
  pattern?: string | RegExp;
  method: ActionMethod;
  methodName: string;
}

export interface ControllerMiddlewareMetadata {
  target: ObjectType<any>;
  methodName?: string;
  handler: MiddlewareHandler<any, any>;
}

export interface ControllerHttpContextMetadata {
  target: ObjectType<any>;
  propertyName: string;
}

/**
 * Stores all the metadata to be used by the controllers.
 */
class ControllerMetadataStorage {
  // prettier-ignore
  private readonly controllersMetadata = new Map<ObjectType<any>, ControllerMetadata>();

  // prettier-ignore
  private readonly actionMetadata = new Map<ObjectType<any>, ControllerActionMetadata[]>();

  // prettier-ignore
  private readonly errorHandlers = new Map<ObjectType<any>, ControllerMethodMetadata>();

  // prettier-ignore
  private readonly noMatchHandlers = new Map<ObjectType<any>, ControllerMethodMetadata>();

  // prettier-ignore
  private readonly middlewaresMetadata = new Map<ObjectType<any>, ControllerMiddlewareMetadata[]>();

  // prettier-ignore
  private readonly contextMetadata = new Map<ObjectType<any>, ControllerHttpContextMetadata[]>();

  // prettier-ignore
  private readonly afterRequestMetadata = new Map<ObjectType<any>, ControllerMethodMetadata>();

  // prettier-ignore
  private readonly beforeRequestMetadata = new Map<ObjectType<any>, ControllerMethodMetadata>();

  addController(controllerMetadata: ControllerMetadata) {
    this.controllersMetadata.set(controllerMetadata.target, controllerMetadata);
  }

  addAction(actionMetadata: ControllerActionMetadata) {
    const actions = this.actionMetadata.get(actionMetadata.target);

    if (actions) {
      for (const action of actions) {
        // prettier-ignore
        if (action.method === actionMetadata.method && action.pattern === actionMetadata.pattern) {
          throw new Error(`Conflicting route path: ${action.method} "${action.pattern || "/"}"`);
        }
      }

      actions.push(actionMetadata);
    } else {
      this.actionMetadata.set(actionMetadata.target, [actionMetadata]);
    }
  }

  addErrorHandler(errorHandler: ControllerMethodMetadata) {
    this.errorHandlers.set(errorHandler.target, errorHandler);
  }

  addNoMatchHandler(noMatchHandler: ControllerMethodMetadata) {
    this.noMatchHandlers.set(noMatchHandler.target, noMatchHandler);
  }

  addMiddleware(middleware: ControllerMiddlewareMetadata) {
    const middlewares = this.middlewaresMetadata.get(middleware.target);

    if (middlewares) {
      middlewares.push(middleware);
    } else {
      this.middlewaresMetadata.set(middleware.target, [middleware]);
    }
  }

  addContext(context: ControllerHttpContextMetadata) {
    const contexts = this.contextMetadata.get(context.target);

    if (contexts) {
      contexts.push(context);
    } else {
      this.contextMetadata.set(context.target, [context]);
    }
  }

  addAfterRequest(afterRequest: ControllerMethodMetadata) {
    this.beforeRequestMetadata.set(afterRequest.target, afterRequest);
  }

  addBeforeRequest(beforeRequest: ControllerMethodMetadata) {
    this.afterRequestMetadata.set(beforeRequest.target, beforeRequest);
  }

  getController(type: ObjectType<any>): ControllerMetadata | undefined {
    const result = this.controllersMetadata.get(type);

    if (!result) {
      const controllers = Array.from(this.controllersMetadata.entries());

      for (const [target, controller] of controllers) {
        if (type.prototype instanceof target) {
          return controller;
        }
      }
    }

    return result;
  }

  getActions(type: ObjectType<any>): ControllerActionMetadata[] {
    const result: ControllerActionMetadata[] = this.actionMetadata.get(type) || [];
    const actionsMetadata = Array.from(this.actionMetadata.entries());

    for (const [target, actions] of actionsMetadata) {
      if (type.prototype instanceof target) {
        result.push(...actions);
      }
    }

    return result;
  }

  getErrorHandler(type: ObjectType<any>): ControllerMethodMetadata | undefined {
    const result = this.errorHandlers.get(type);

    if (!result) {
      const errorHandlers = Array.from(this.errorHandlers.entries());

      for (const [target, errorHandler] of errorHandlers) {
        if (type.prototype instanceof target) {
          return errorHandler;
        }
      }
    }

    return result;
  }

  getNoMatchHandler(type: ObjectType<any>): ControllerMethodMetadata | undefined {
    const result = this.noMatchHandlers.get(type);

    if (!result) {
      const noMatchHandlers = Array.from(this.noMatchHandlers.entries());

      for (const [target, noMatchHandler] of noMatchHandlers) {
        if (type.prototype instanceof target) {
          return noMatchHandler;
        }
      }
    }

    return result;
  }

  getMiddlewares(type: ObjectType<any>): ControllerMiddlewareMetadata[] {
    const result: ControllerMiddlewareMetadata[] = this.middlewaresMetadata.get(type) || [];
    const middlewaresMetadata = Array.from(this.middlewaresMetadata.entries());

    for (const [target, middlewares] of middlewaresMetadata) {
      if (type.prototype instanceof target) {
        result.push(...middlewares);
      }
    }

    return result;
  }

  getContext(type: ObjectType<any>): ControllerHttpContextMetadata[] {
    const result: ControllerHttpContextMetadata[] = this.contextMetadata.get(type) || [];
    const contextMetadata = Array.from(this.contextMetadata.entries());

    for (const [target, contexts] of contextMetadata) {
      if (type.prototype instanceof target) {
        result.push(...contexts);
      }
    }

    return result;
  }

  getBeforeRequest(type: ObjectType<any>): ControllerMethodMetadata | undefined {
    const result = this.beforeRequestMetadata.get(type);

    if (!result) {
      const beforeRequestMetadata = Array.from(this.beforeRequestMetadata.entries());

      for (const [target, beforeRequest] of beforeRequestMetadata) {
        if (type.prototype instanceof target) {
          return beforeRequest;
        }
      }
    }

    return result;
  }

  getAfterRequest(type: ObjectType<any>): ControllerMethodMetadata | undefined {
    const result = this.afterRequestMetadata.get(type);

    if (!result) {
      const afterRequestMetadata = Array.from(this.afterRequestMetadata.entries());

      for (const [target, afterRequest] of afterRequestMetadata) {
        if (type.prototype instanceof target) {
          return afterRequest;
        }
      }
    }

    return result;
  }
}

const metadataStorage = new ControllerMetadataStorage();

/**
 * Gets the metadata for all the stored controllers.
 */
export function getMetadataStorage(): ControllerMetadataStorage {
  return metadataStorage;
}

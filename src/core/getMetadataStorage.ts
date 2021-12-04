import { Middleware, ObjectType } from "./types";
import { ActionType } from "./ActionType";
import { RouteControllerConfig } from "..";

interface ControllerMetadata {
  target: ObjectType<any>;
  config: RouteControllerConfig;
}

interface ControllerActionMetadata {
  target: ObjectType<any>;
  pattern?: string | RegExp;
  method: ActionType;
  methodName: string;
}

interface ControllerErrorHandlerMetadata {
  target: ObjectType<any>;
  methodName: string;
}

interface ControllerMiddlewareMetadata {
  target: ObjectType<any>;
  methodName?: string;
  handler: Middleware<any, any>;
}

interface ControllerHttpContextMetadata {
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
  private readonly errorHandlers = new Map<ObjectType<any>, ControllerErrorHandlerMetadata>();

  // prettier-ignore
  private readonly middlewaresMetadata = new Map<ObjectType<any>, ControllerMiddlewareMetadata[]>();

  // prettier-ignore
  private readonly contextMetadata = new Map<ObjectType<any>, ControllerHttpContextMetadata[]>();

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

  addErrorHandler(errorHandler: ControllerErrorHandlerMetadata) {
    this.errorHandlers.set(errorHandler.target, errorHandler);
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
    const result: ControllerActionMetadata[] =
      this.actionMetadata.get(type) || [];
    const actionsMetadata = Array.from(this.actionMetadata.entries());

    for (const [target, actions] of actionsMetadata) {
      if (type.prototype instanceof target) {
        result.push(...actions);
      }
    }

    return result;
  }

  // prettier-ignore
  getErrorHandler(type: ObjectType<any>): ControllerErrorHandlerMetadata | undefined {
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

  getMiddlewares(type: ObjectType<any>): ControllerMiddlewareMetadata[] {
    const result: ControllerMiddlewareMetadata[] =
      this.middlewaresMetadata.get(type) || [];
    const middlewaresMetadata = Array.from(this.middlewaresMetadata.entries());

    for (const [target, middlewares] of middlewaresMetadata) {
      if (type.prototype instanceof target) {
        result.push(...middlewares);
      }
    }

    return result;
  }

  getContext(type: ObjectType<any>): ControllerHttpContextMetadata[] {
    const result: ControllerHttpContextMetadata[] =
      this.contextMetadata.get(type) || [];
    const contextMetadata = Array.from(this.contextMetadata.entries());

    for (const [target, contexts] of contextMetadata) {
      if (type.prototype instanceof target) {
        result.push(...contexts);
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

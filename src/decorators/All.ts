import { getMetadataStorage } from "../core/getMetadataStorage";

/**
 * Register a handler for request in all HTTP methods.
 * @param pattern Pattern for matching the route.
 */
export function All(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: "ALL",
      methodName,
    });
  };
}

import { getMetadataStorage } from "../core/getMetadataStorage";

/**
 * Register a handler for 'POST' requests.
 * @param pattern Pattern for matching the route.
 */
export function Post(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: "POST",
      methodName,
    });
  };
}

import { getMetadataStorage } from "../core/getMetadataStorage";

/**
 * Register a handler for 'HEAD' requests.
 * @param pattern Pattern for matching the route.
 */
export function Head(pattern?: string | RegExp) {
  return function (target: any, methodName: string) {
    getMetadataStorage().addAction({
      target: target.constructor,
      pattern: pattern,
      method: "HEAD",
      methodName,
    });
  };
}

import { getMetadataStorage } from '..';

/**
 * Injects the `HttpContext` in a property.
 */
export function Context() {
  return function (target: any, propertyKey: string) {
    getMetadataStorage().addContext({
      target: target.constructor,
      propertyName: propertyKey,
    });
  };
}

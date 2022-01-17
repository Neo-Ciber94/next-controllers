import { getMetadataStorage, getString } from '..';

/**
 * Injects the `HttpContext` in a property.
 */
export function Context(): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const propertyName = getString(propertyKey);
    getMetadataStorage().addContext({
      target: target.constructor,
      propertyName,
    });
  };
}

import { createServer, RequestListener } from 'http';
import { apiResolver } from 'next/dist/server/api-utils';
import { withController } from 'src';
import supertest from 'supertest';

type ObjectType<T> = { new (...args: any[]): T };

type QueryParams = Record<string, string | string[]>;

/**
 * Represents a `SuperTest` instance that should be closed.
 */
export type SuperTestHandler = supertest.SuperTest<supertest.Test> & { close: () => void };

/**
 * Creates a test server with the given controller and returns a instance to send test request.
 * @param target The controller class.
 * @returns A `SuperTest` instance to test the controller that should be close at the end, to close the
 * underlying server used.
 */
export function withTestController<T = any>(target: ObjectType<T>): SuperTestHandler {
  const handler = withController(target, '');

  const listener: RequestListener = (req, res) => {
    const query = parseQuery(req.url);
    return apiResolver(
      req,
      res,
      query,
      handler,
      {
        previewModeEncryptionKey: '',
        previewModeId: '',
        previewModeSigningKey: '',
      },
      false,
    );
  };

  const server = createServer(listener);
  let closed = false;

  const close = () => {
    if (!closed) {
      closed = true;
      server.close();
    }
  };

  const test = supertest(server);
  (test as any).close = close;
  return test as SuperTestHandler;
}

function parseQuery(url?: string): QueryParams {
  const query = url?.split('?')[1];

  if (!query) {
    return {};
  }

  return query.split('&').reduce((acc, cur) => {
    const [key, value] = cur.split('=');
    const array = value.split(',');
    if (array.length > 1) {
      acc[key] = array;
    } else {
      acc[key] = value;
    }
    return acc;
  }, {} as QueryParams);
}

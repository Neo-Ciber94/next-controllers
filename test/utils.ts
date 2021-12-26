import { createServer, RequestListener } from 'http';
import { apiResolver } from 'next/dist/server/api-utils';
import { withController } from 'src';
import supertest from 'supertest';

type ObjectType<T> = { new (...args: any[]): T };

export type SuperTestHandler = supertest.SuperTest<supertest.Test> & { close: () => void };

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

type QueryParams = Record<string, string | string[]>;

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

import { createServer, RequestListener } from 'http';
import { apiResolver } from 'next/dist/server/api-utils';
import { withController } from 'src';
import supertest from 'supertest';

type ObjectType<T> = { new (...args: any[]): T };

export type SuperTestHandler = supertest.SuperTest<supertest.Test> & { close: () => void };

export function withTestController<T = any>(target: ObjectType<T>): SuperTestHandler {
  const handler = withController(target, '');

  const listener: RequestListener = (req, res) => {
    return apiResolver(
      req,
      res,
      undefined,
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

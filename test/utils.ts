import { createServer, RequestListener, Server } from 'http';
import { apiResolver } from 'next/dist/server/api-utils';

export type RouteHandler<Req, Res> = (req: Req, res: Res) => Promise<any> | any;

export type TestHandler = (server: Server) => Promise<void> | void;

export async function testApiHandler<Req, Res>(handler: RouteHandler<Req, Res>, test: TestHandler) {
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

  try {
    await test(server);
  } finally {
    server.close();
  }
}
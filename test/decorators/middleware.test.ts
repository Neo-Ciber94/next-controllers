import { NextApiRequest, NextApiResponse } from 'next';
import { Get, Middleware, NextApiContext, UseMiddleware } from 'src';
import { withTestController } from 'test/utils';

const nop: Middleware<unknown, unknown> = (_req, _res, next) => next();

const routeMiddleware: Middleware<NextApiRequest, NextApiResponse> = (req, res, next) => {
  res.setHeader('route-middleware', 'true');
  next();
};

const actionMiddleware: Middleware<NextApiRequest, NextApiResponse> = (req, res, next) => {
  res.setHeader('action-middleware', 'true');
  next();
};

@UseMiddleware(routeMiddleware, nop)
class MyController {
  @Get('/')
  get() {
    return 'Hello World!';
  }

  @Get('/:name')
  @UseMiddleware(actionMiddleware)
  sayHello({ request }: NextApiContext) {
    return `Hello ${request.params.name}!`;
  }
}

const handler = withTestController(MyController);

describe('@UseMiddleare', () => {
  it('should add middleware to the route', async () => {
    const res = await handler.get('/api');
    expect(res.headers['route-middleware']).toBe('true');
    expect(res.text).toBe('Hello World!');
  });

  it('should add middleware to the action', async () => {
    const res = await handler.get('/api/Mikael');
    expect(res.headers['action-middleware']).toBe('true');
    expect(res.text).toBe('Hello Mikael!');
  });
});

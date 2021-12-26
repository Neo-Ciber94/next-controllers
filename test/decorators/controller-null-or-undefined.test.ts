import { Get, NextApiContext, RouteController } from 'src';
import { withTestController } from 'test/utils';

@RouteController({
  statusCodeOnNull: 200,
  statusCodeOnUndefined: 400,
})
class MyController {
  @Get('/return')
  getReturn({ request }: NextApiContext) {
    const { message } = request.query;

    if (message === 'null') {
      return null;
    }

    if (message === 'undefined') {
      return undefined;
    }

    return {};
  }

  @Get('/response')
  getResponse({ request, response }: NextApiContext) {
    const { message } = request.query;

    if (message === 'null') {
      response.send(null);
      return;
    }

    if (message === 'undefined') {
      // THIS WILL SEND 200 OK
      response.send(undefined);
      return undefined;
    }

    return {};
  }
}

const handler = withTestController(MyController);
afterAll(() => handler.close());

describe('@RouteController with null or undefined response', () => {
  test('returns 200 with return null', async () => {
    await handler.get('/api/return?message=null').expect(200);
  });

  test('returns 400 with return undefined', async () => {
    await handler.get('/api/return?message=undefined').expect(400);
  });

  test('returns 200 with response null', async () => {
    await handler.get('/api/response?message=null').expect(200);
  });

  // This will receive 200 OK
  test('returns 200 with response undefined', async () => {
    await handler.get('/api/response?message=undefined').expect(200);
  });
});

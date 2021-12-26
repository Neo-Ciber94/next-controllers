import { Get, NextApiContext, RouteController } from 'src';
import { withTestController } from 'test/utils';

@RouteController({
  statusCodeOnNull: 200,
  statusCodeOnUndefined: 400,
})
class MyController {
  @Get('/return')
  get({ request }: NextApiContext) {
    const { message } = request.query;

    if (message === 'null') {
      return null;
    }

    if (message === 'undefined') {
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
});

import { Get, NextApiContext, Post, RouteController } from 'src';
import { withTestController } from 'test/utils';

type Data = {
  count: number;
};

@RouteController<Data>({
  state: { count: 0 },
})
class ControllerWithState {
  @Post('/count')
  increment({ response, state }: NextApiContext<Data>) {
    state.count += 1;
    response.end();
  }

  @Get('/count')
  getCount({ state }: NextApiContext<Data>) {
    return state.count;
  }
}

const handler = withTestController(ControllerWithState);
afterAll(() => handler.close());

describe('Controller with state', () => {
  test('increment and get count', async () => {
    await handler.get('/api/count').expect(200, '0');
    await handler.post('/api/count').expect(200);
    await handler.post('/api/count').expect(200);
    await handler.post('/api/count').expect(200);
    await handler.get('/api/count').expect(200, '3');
  });
});

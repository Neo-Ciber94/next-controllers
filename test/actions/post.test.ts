import { NextApiContext, Post } from 'src';
import { withTestController } from 'test/utils';

class EchoController {
  @Post('/echo')
  echo({ request }: NextApiContext) {
    return request.body;
  }
}

const handler = withTestController(EchoController);

afterAll(() => handler.close());

describe('@Post decorator with route', () => {
  test('POST /api/echo', () => {
    return handler.post('/api/echo').send({ hello: 'world' }).expect(200, { hello: 'world' });
  });
});

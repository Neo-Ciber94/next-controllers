import { NextApiContext, Post, withController } from 'src';
import { withTestController } from 'test/utils';

class TestController {
  @Post('/echo-return')
  postEchoFromReturn({ request }: NextApiContext) {
    return request.body;
  }

  @Post('/echo-response')
  postEchoFromResponse({ request, response }: NextApiContext) {
    response.json(request.body);
  }
}

const handler = withTestController(TestController);

afterAll(() => handler.close());

describe('POST [route]', () => {
  test('Post from return', async () => {
    const res = await handler.post('/api/echo-return').set('Content-Type', 'application/json').send({ name: 'Marie' });

    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ name: 'Marie' });
  });

  test('Post from response', async () => {
    const res = await handler.post('/api/echo-response').set('Content-Type', 'application/json').send({ age: 20 });

    expect(res.status).toBe(200);
    expect(res.body).toStrictEqual({ age: 20 });
  });
});

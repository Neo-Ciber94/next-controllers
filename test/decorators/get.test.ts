import { Get, NextApiContext, withController } from 'src';
import { testApiHandler } from 'test/utils';
import supertest from 'supertest';

class TestController {
  @Get('/hello-return')
  getFromReturn() {
    return 'Hello Return!';
  }

  @Get('/hello-response')
  getFromResponse({ response }: NextApiContext) {
    response.send('Hello Response!');
  }
}

const handler = withController(TestController, '');

describe('GET [route]', () => {
  test('Response from function return', () => {
    return testApiHandler(handler, async (server) => {
      const res = await supertest(server).get('/api/hello-return');
      expect(res.statusCode).toBe(200);
      expect(res.text).toStrictEqual('Hello Return!');
    });
  });

  test('Response from response', () => {
    return testApiHandler(handler, async (server) => {
      const res = await supertest(server).get('/api/hello-response');
      expect(res.statusCode).toBe(200);
      expect(res.text).toStrictEqual('Hello Response!');
    });
  });
});

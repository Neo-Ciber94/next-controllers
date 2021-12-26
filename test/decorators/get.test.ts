import { Get, withController } from 'src';
import { testApiHandler } from 'test/utils';
import supertest from 'supertest';

class TestController {
  @Get('/')
  get() {
    return 'Hello World!';
  }
}

const handler = withController(TestController, '');

describe('GET [route]', () => {
  test('Response from function return', () => {
    return testApiHandler(handler, async (server) => {
      const res = await supertest(server).get('/api/');
      expect(res.statusCode).toBe(200);
      expect(res.text).toStrictEqual('Hello World!');
    });
  });

  //   test('Response from res.send', async () => {
  //     await testApiHandler(handler, (server) => {
  //       const req = request(server);
  //       req.get('/api/hello-res').expect(200, 'Hello2');
  //     });
  //   });
});

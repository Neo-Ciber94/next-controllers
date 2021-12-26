import { Get, NextApiContext } from 'src';
import { withTestController } from './utils';

class TestController {
  @Get('/from-return')
  getFromReturn() {
    return 'Hello Return!';
  }

  @Get('/from-response')
  getFromResponse({ response }: NextApiContext) {
    response.send('Hello Response!');
  }

  @Get('/from-return-async')
  async getFromReturnAsync() {
    return await Promise.resolve('Hello Return!');
  }

  @Get('/from-response-async')
  async getFromResponseAsync({ response }: NextApiContext) {
    response.send('Hello Response!');
    await Promise.resolve();
  }
}

const handler = withTestController(TestController);

// Close the server
afterAll(() => handler.close());

describe('Controller responses', () => {
  test('Response from function return', () => {
    return handler.get('/api/from-return').expect(200, 'Hello Return!');
  });

  test('Response from context response', () => {
    return handler.get('/api/from-response').expect(200, 'Hello Response!');
  });

  test('Response from function return async', () => {
    return handler.get('/api/from-return-async').expect(200, 'Hello Return!');
  });

  test('Response from context response async', () => {
    return handler.get('/api/from-response-async').expect(200, 'Hello Response!');
  });
});

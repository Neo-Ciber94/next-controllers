import { Get, NextApiContext } from 'src';
import { withTestController } from 'test/utils';

class HelloController {
  @Get('/hello')
  getHello() {
    return 'Hello!';
  }

  @Get('/hello/:name')
  sayHello({ request }: NextApiContext) {
    return `Hello ${request.params.name}!`;
  }
}

const handler = withTestController(HelloController);

afterAll(() => handler.close());

describe('@Get decorator with route', () => {
  test('GET /api/hello', () => {
    return handler.get('/api/hello').expect(200, 'Hello!');
  });

  test('GET /api/hello/:name', () => {
    return handler.get('/api/hello/John').expect(200, 'Hello John!');
  });
});

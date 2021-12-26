import { Get } from 'src';
import { withTestController } from 'test/utils';

class HelloController {
  @Get('/hello')
  getHello() {
    return 'Hello!';
  }
}

const handler = withTestController(HelloController);

afterAll(() => handler.close());

describe('@Get decorator with route', () => {
  test('GET /api/hello', () => {
    return handler.get('/api/hello').expect(200, 'Hello!');
  });
});

import { Get } from 'src';
import { withTestController } from '../utils';

class MyController {
  @Get('/')
  sayHello() {
    return 'Hello World!';
  }
}

const handler = withTestController(MyController, '/custom-route');

afterAll(() => handler.close());

describe('withController with custom route', () => {
  test('Custom route controller', () => {
    return handler.get('/api/custom-route').expect(200, 'Hello World!');
  });
});

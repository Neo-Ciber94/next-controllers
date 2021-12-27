import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.text('Hello World');
  }
}

const handler = withTestController(MyController);

describe('Results.text()', () => {
  test('should return text', () => {
    return handler.get('/api').expect(200, 'Hello World');
  });
});

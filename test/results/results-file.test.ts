import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.file('./test/assets/test.txt', 'text/plain');
  }
}

const handler = withTestController(MyController);

describe('Results.file()', () => {
  test('should return file', () => {
    return handler.get('/api').expect(200, 'Hello World!');
  });
});

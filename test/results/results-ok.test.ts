import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  getOk() {
    return Results.ok();
  }

  @Get('/message')
  getMessage() {
    return Results.ok('Hello World');
  }
}

const handler = withTestController(MyController);

describe('Results.ok()', () => {
  test('should return the default message', () => {
    return handler.get('/api').expect(200, 'OK');
  });

  test('should return the message', () => {
    return handler.get('/api/message').expect(200, 'Hello World');
  });
});

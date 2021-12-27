import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.accepted();
  }

  @Get('/message')
  getMessage() {
    return Results.accepted('Hello World');
  }
}

const handler = withTestController(MyController);

describe('Results.accepted()', () => {
  test('should return status code 202', () => {
    return handler.get('/api').expect(202, 'Accepted');
  });

  test('should return status 202 and message', () => {
    return handler.get('/api/message').expect(202, 'Hello World');
  });
});

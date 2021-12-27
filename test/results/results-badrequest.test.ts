import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.badRequest();
  }

  @Get('/message')
  getMessage() {
    return Results.badRequest('Invalid data');
  }
}

const handler = withTestController(MyController);

describe('Results.badRequest()', () => {
  test('should return status code 400', () => {
    return handler.get('/api/').expect(400, 'Bad Request');
  });

  test('should return status code 400 and message', () => {
    return handler.get('/api/message').expect(400, 'Invalid data');
  });
});

import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.internalServerError();
  }

  @Get('/message')
  getMessage() {
    return Results.internalServerError('Database error');
  }
}

const handler = withTestController(MyController);

describe('Results.internalServerError()', () => {
  test('should return status code 500', () => {
    return handler.get('/api/').expect(500, 'Internal Server Error');
  });

  test('should return status code 500 and message', () => {
    return handler.get('/api/message').expect(500, 'Database error');
  });
});

import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.notFound();
  }

  @Get('/message')
  getMessage() {
    return Results.notFound('User not found');
  }
}

const handler = withTestController(MyController);

describe('Results.notFound()', () => {
  test('should return status code 404', () => {
    return handler.get('/api/').expect(404, 'Not Found');
  });

  test('should return status code 404 and message', () => {
    return handler.get('/api/message').expect(404, 'User not found');
  });
});

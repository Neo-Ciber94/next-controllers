import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.unauthorized();
  }

  @Get('/message')
  getMessage() {
    return Results.unauthorized('Need access token');
  }
}

const handler = withTestController(MyController);

describe('Results.unauthorized()', () => {
  test('should return status code 401', () => {
    return handler.get('/api/').expect(401, 'Unauthorized');
  });

  test('should return status code 401 and message', () => {
    return handler.get('/api/message').expect(401, 'Need access token');
  });
});

import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.forbidden();
  }

  @Get('/message')
  getMessage() {
    return Results.forbidden('Admin access only');
  }
}

const handler = withTestController(MyController);

describe('Results.forbidden()', () => {
  test('should return status code 403', () => {
    return handler.get('/api/').expect(403, 'Forbidden');
  });

  test('should return status code 403 and message', () => {
    return handler.get('/api/message').expect(403, 'Admin access only');
  });
});

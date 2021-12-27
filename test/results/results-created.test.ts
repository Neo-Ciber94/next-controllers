import { Post, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Post('/')
  create() {
    const data = {
      id: 1,
      name: 'John Doe',
    };

    return Results.created(data, '/users/1');
  }
}

const handler = withTestController(MyController);

describe('Results.created', () => {
  test('should return 201 and the data', () => {
    return handler.post('/api').expect('Location', '/users/1').expect(201, {
      id: 1,
      name: 'John Doe',
    });
  });
});

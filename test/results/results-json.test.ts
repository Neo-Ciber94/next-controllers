import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.json({
      name: 'John Doe',
    });
  }
}

const handler = withTestController(MyController);

describe('results.json', () => {
  test('should return json', async () => {
    return handler.get('/api').expect(200, { name: 'John Doe' });
  });
});

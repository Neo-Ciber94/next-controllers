import { Delete, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Delete('/')
  delete() {
    return Results.noContent();
  }
}

const handler = withTestController(MyController);

describe('Results.noContent()', () => {
  test('should return status code 204', () => {
    return handler.delete('/api').expect(204, '');
  });
});

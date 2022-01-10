import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    return Results.download({
      filePath: './test/assets/test.txt',
      contentType: 'text/plain',
      fileName: 'test.txt',
    });
  }
}

const handler = withTestController(MyController);

describe('Results.download()', () => {
  test('should return file', () => {
    return handler.get('/api').expect(200, 'Hello World!');
  });
});

import { NextApiContext, Delete } from 'src';
import { withTestController } from 'test/utils';

class TextController {
  @Delete('/last-word')
  lastWorld({ request }: NextApiContext) {
    const text = String(request.body);
    return text.split(' ').pop();
  }
}

const handler = withTestController(TextController);

afterAll(() => handler.close());

describe('@Delete decorator with route', () => {
  test('Delete /api/last-word', () => {
    return handler.delete('/api/last-word').set('Content-Type', 'text/plain').send('Hello World').expect(200, 'World');
  });
});

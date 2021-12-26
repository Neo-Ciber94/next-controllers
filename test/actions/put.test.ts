import { NextApiContext, Put } from 'src';
import { withTestController } from 'test/utils';

class ReverseController {
  @Put('/reverse')
  reverse({ request }: NextApiContext) {
    const text = String(request.body);
    return text.split('').reverse().join('');
  }
}

const handler = withTestController(ReverseController);

afterAll(() => handler.close());

describe('@Put decorator with route', () => {
  test('PUT /api/reverse', () => {
    return handler.put('/api/reverse').set('Content-Type', 'text/plain').send('Hello World').expect(200, 'dlroW olleH');
  });
});

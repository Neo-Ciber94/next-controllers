import { NextApiContext, Patch } from 'src';
import { withTestController } from 'test/utils';

class ReverseController {
  @Patch('/reverse')
  reverse({ request }: NextApiContext) {
    const text = String(request.body);
    return text.split('').reverse().join('');
  }
}

const handler = withTestController(ReverseController);

afterAll(() => handler.close());

describe('@Patch decorator with route', () => {
  test('PATCH /api/reverse', () => {
    return handler.patch('/api/reverse').set('Content-Type', 'text/plain').send('Hello World').expect(200, 'dlroW olleH');
  });
});

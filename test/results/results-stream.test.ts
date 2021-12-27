import { Get, Results } from 'src';
import fs from 'fs';
import { Parsers, withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    const stream = fs.createReadStream('./examples/assets/test.txt');
    return Results.stream(stream, 'text/plain');
  }
}

const handler = withTestController(MyController);

describe('Results.stream()', () => {
  test('should return a stream', async () => {
    const res = await handler.get('/api').expect(200).buffer().parse(Parsers.utf8Parser());
    expect(res.body).toBe('Hello World!');
  });
});

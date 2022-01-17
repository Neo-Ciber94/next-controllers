import { Get, Results } from 'src';
import fs from 'fs';
import { Parsers, withTestController } from 'test/utils';

class MyController {
  @Get('/')
  get() {
    const buffer = fs.readFileSync('./examples/assets/test.txt');
    return Results.bytes(buffer, 'text/plain');
  }
}

const handler = withTestController(MyController);

describe('Results.bytes()', () => {
  test('should return a buffer', async () => {
    const res = await handler.get('/api').expect(200).buffer().parse(Parsers.utf8Parser());
    expect(res.body).toBe('Hello World!');
  });
});

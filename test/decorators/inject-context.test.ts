import { Context, Get, NextApiContext } from 'src';
import { withTestController } from '../utils';

class InjectContextController {
  @Context()
  private readonly myContext!: NextApiContext;

  @Get('/hello')
  sayHello() {
    this.myContext.response.send('Hello World!');
  }
}

const handler = withTestController(InjectContextController);
afterAll(() => handler.close());

describe('@Context decorator', () => {
  test('Inject HttpContext', () => {
    return handler.get('/api/hello').expect(200, 'Hello World!');
  });
});

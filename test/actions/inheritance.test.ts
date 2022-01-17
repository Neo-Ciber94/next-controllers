import { Get } from 'src';
import { withTestController } from 'test/utils';

class BaseController {
  @Get('/number')
  getNumber() {
    return 12;
  }

  @Get('/string')
  getText() {
    return 'Hello World';
  }
}

class NewController extends BaseController {
  @Get('/number')
  override getNumber() {
    return 35;
  }
}

const handler = withTestController(NewController);

afterAll(() => handler.close());

describe('Controller inheritance', () => {
  it('Request to overriden method', async () => {
    const response = await handler.get('/api/number');
    expect(response.status).toBe(200);
    expect(response.text).toBe('35');
  });

  it('Request to base method', async () => {
    const response = await handler.get('/api/string');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World');
  });
});

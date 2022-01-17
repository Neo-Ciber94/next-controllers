import { AfterRequest, Get } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  static value = 0;
  static other = 1;

  private readonly two = 2;

  @AfterRequest()
  afterRequest() {
    MyController.value += 1;
    MyController.other *= this.two;
  }

  @Get('/')
  get() {
    return 'Hello World!';
  }
}

const handler = withTestController(MyController);

afterAll(() => handler.close());

describe('@AfterRequest', () => {
  test('should be called after request', async () => {
    await handler.get('/api');
    await handler.get('/api');

    const response = await handler.get('/api');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
    expect(MyController.value).toBe(3);
    expect(MyController.other).toBe(8);
  });
});

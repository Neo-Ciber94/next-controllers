import { BeforeRequest, Get } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  static value = 0;

  @BeforeRequest()
  beforeRequest() {
    MyController.value += 1;
  }

  @Get('/')
  get() {
    return 'Hello World!';
  }
}

const handler = withTestController(MyController);

afterAll(() => handler.close());

describe('@BeforeRequest', () => {
  test('should be called before request', async () => {
    await handler.get('/api');
    await handler.get('/api');

    const response = await handler.get('/api');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
    expect(MyController.value).toBe(3);
  });
});

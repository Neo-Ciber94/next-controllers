import { Get, NextApiContext, OnNoMatch } from 'src';
import { withTestController } from 'test/utils';

class TestController {
  @Get('/hello')
  hello() {
    return 'Hello World!';
  }

  @OnNoMatch()
  noMatch({ request, response }: NextApiContext) {
    response.statusCode = 404;

    if (request.headers.source === 'response') {
      return response.send('No match (Response)');
    }

    if (request.headers.source === 'return') {
      return 'No match (Return)';
    }

    return 'No match';
  }
}

const handler = withTestController(TestController);

describe('@OnNoMatch route', () => {
  test('should handle no match with response', async () => {
    const response = await handler.get('/no-found').set('source', 'response');

    expect(response.status).toBe(404);
    expect(response.text).toBe('No match (Response)');
  });

  test('should handle no match with return', async () => {
    const response = await handler.get('/no-found').set('source', 'return');

    expect(response.status).toBe(404);
    expect(response.text).toBe('No match (Return)');
  });

  test('should handle no match with message', async () => {
    const response = await handler.get('/no-found');

    expect(response.status).toBe(404);
    expect(response.text).toBe('No match');
  });
});

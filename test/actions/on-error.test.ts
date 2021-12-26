import { NextApiContext, OnError, Post } from 'src';
import { withTestController } from 'test/utils';

class OnErrorController {
  @Post('/throw')
  throwError({ request }: NextApiContext) {
    const message = request.body.message;
    throw new Error(message);
  }

  @OnError()
  handleError(error: Error, { response }: NextApiContext) {
    const message = error.message;

    if (message.startsWith('response:')) {
      const text = message.substring('response:'.length);
      response.send(text);
      return;
    }

    if (message.startsWith('return:')) {
      const text = message.substring('return:'.length);
      return text;
    }

    return message;
  }
}

const handler = withTestController(OnErrorController);
afterAll(() => handler.close());

describe('@OnError route', () => {
  test('should handle error with response', async () => {
    const response = await handler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'response:hello' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('hello');
  });

  test('should handle error with return', async () => {
    const response = await handler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'return:hello' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('hello');
  });

  test('should handle error with message', async () => {
    const response = await handler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'Hello World!' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
  });
});

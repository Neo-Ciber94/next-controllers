import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorHandler, NextApiContext, Post, RouteController } from 'src';
import { ErrorHandlerInterface } from 'src/interfaces/error-handler';
import { withTestController } from 'test/utils';

const handleError: ErrorHandler<NextApiRequest, NextApiResponse> = (error, { response }) => {
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
};

class GlobalErrorHandler implements ErrorHandlerInterface {
  onError(error: any, { response }: NextApiContext) {
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

@RouteController({ onError: handleError })
class ErrorController {
  @Post('/throw')
  throw({ request }: NextApiContext) {
    const { message } = request.body;
    throw new Error(message);
  }
}

@RouteController({ onError: new GlobalErrorHandler() })
class GlobalErrorController {
  @Post('/throw')
  throw({ request }: NextApiContext) {
    const { message } = request.body;
    throw new Error(message);
  }
}

const errorHandler = withTestController(ErrorController);
const globalErrorHandler = withTestController(GlobalErrorController);

afterAll(() => {
  errorHandler.close();
  globalErrorHandler.close();
});

describe('@RouteController onError route', () => {
  test('should handle error with response', async () => {
    const response = await errorHandler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'response:hello' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('hello');
  });

  test('should handle error with return', async () => {
    const response = await errorHandler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'return:hello' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('hello');
  });

  test('should handle error with message', async () => {
    const response = await errorHandler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'Hello World!' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
  });
});

describe('@RouteController onError with ErrorHandlerInterface', () => {
  test('should handle error with response', async () => {
    const response = await globalErrorHandler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'response:hello' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('hello');
  });

  test('should handle error with return', async () => {
    const response = await globalErrorHandler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'return:hello' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('hello');
  });

  test('should handle error with message', async () => {
    const response = await errorHandler
      .post('/api/throw')
      .set('Content-Type', 'application/json')
      .set('Accept', 'text/plain')
      .send({ message: 'Hello World!' });

    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello World!');
  });
});

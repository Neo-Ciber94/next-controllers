import { All, Get, NextApiContext } from 'src';
import { withTestController } from 'test/utils';

class CaptureAllController {
  @All('/*')
  captureAll({ response }: NextApiContext) {
    response.setHeader('Captured', 'true');
    return 'Hello World!';
  }
}

class CaptureAlmostAllController {
  @Get('/bye')
  bye() {
    return 'Good bye!';
  }

  @All('/*')
  captureAll() {
    return 'Hello World!';
  }
}

const captureAllHandler = withTestController(CaptureAllController);
const captureAlmostAllHandler = withTestController(CaptureAlmostAllController);

afterAll(() => {
  captureAllHandler.close();
  captureAlmostAllHandler.close();
});

describe('@All capture all requests', () => {
  test('should capture get request', () => {
    return captureAllHandler.get('/api/hello').expect(200, 'Hello World!');
  });

  test('should capture post request', () => {
    return captureAllHandler.post('/api/hello').expect(200, 'Hello World!');
  });

  test('should capture put request', () => {
    return captureAllHandler.put('/api/hello').expect(200, 'Hello World!');
  });

  test('should capture delete request', () => {
    return captureAllHandler.delete('/api/hello').expect(200, 'Hello World!');
  });

  test('should capture patch request', () => {
    return captureAllHandler.patch('/api/hello').expect(200, 'Hello World!');
  });

  test('should capture options request', () => {
    return captureAllHandler.options('/api/hello').expect(200, 'Hello World!');
  });

  test('should capture head request', () => {
    return captureAllHandler.head('/api/hello').expect('Captured', 'true').expect(200);
  });

  test('should capture trace request', () => {
    return captureAllHandler.trace('/api/hello').expect('Captured', 'true').expect(200);
  });

  test('should capture any route request /api/xyz', () => {
    return captureAllHandler.get('/api/xyz').expect(200, 'Hello World!');
  });

  test('should capture any route request /api/xyz/123', () => {
    return captureAllHandler.get('/api/xyz/123').expect(200, 'Hello World!');
  });
});

describe('@All capture all request expected higher priority', () => {
  test('Capture - GET /api/hello', () => {
    return captureAlmostAllHandler.get('/api/hello').expect(200, 'Hello World!');
  });

  test('Not Capture - GET /api/bye', () => {
    return captureAlmostAllHandler.get('/api/bye').expect(200, 'Good bye!');
  });

  test('Capture GET /api/bye/123', () => {
    return captureAlmostAllHandler.get('/api/bye/123').expect(200, 'Hello World!');
  });
});

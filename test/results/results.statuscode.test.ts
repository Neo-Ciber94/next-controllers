import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/206')
  get206() {
    return Results.statusCode(206);
  }

  @Get('/302')
  get302() {
    return Results.statusCode(302);
  }

  @Get('/418')
  get418() {
    return Results.statusCode(418);
  }

  @Get('/501')
  get501() {
    return Results.statusCode(501);
  }
}

const handler = withTestController(MyController);

describe('Results.statusCode()', () => {
  test('should return status code 206', () => {
    return handler.get('/api/206').expect(206, 'Partial Content');
  });

  test('should return status code 302', () => {
    return handler.get('/api/302').expect(302, 'Found');
  });

  test('should return status code 418', () => {
    return handler.get('/api/418').expect(418, "I'm a teapot");
  });

  test('should return status code 501', () => {
    return handler.get('/api/501').expect(501, 'Not Implemented');
  });
});

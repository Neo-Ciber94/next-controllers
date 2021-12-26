import { NextApiContext, Options } from 'src';
import { withTestController } from 'test/utils';

class PingController {
  @Options('/ping')
  ping({ request, response }: NextApiContext) {
    if (request.headers['ping'] != null) {
      response.setHeader('ping', 'pong');
    }

    response.end();
  }
}

const handler = withTestController(PingController);

afterAll(() => handler.close());

describe('@Options decorator with route', () => {
  test('OPTIONS /api/ping', () => {
    return handler.options('/api/ping').set('ping', '').expect('ping', 'pong').expect(200);
  });
});

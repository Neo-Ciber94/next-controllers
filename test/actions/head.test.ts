import { NextApiContext, Head } from 'src';
import { withTestController } from 'test/utils';

class HealthController {
  @Head('/health')
  health({ response }: NextApiContext) {
    response.setHeader('Health', 'OK');
    response.end();
  }
}

const handler = withTestController(HealthController);

afterAll(() => handler.close());

describe('@Head decorator with route', () => {
  test('HEAD /api/health', () => {
    return handler.head('/api/health').expect('Health', 'OK').expect(200);
  });
});

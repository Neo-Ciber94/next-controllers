import { NextApiContext, Trace } from 'src';
import { withTestController } from 'test/utils';

class DateController {
  @Trace('/today')
  today({ request, response }: NextApiContext) {
    const requestDate = request.headers.today?.toString();

    if (requestDate == null) {
      throw new Error();
    }

    const date = new Date(requestDate);
    response.setHeader('today', date.toUTCString());
    response.end();
  }
}

const handler = withTestController(DateController);

afterAll(() => handler.close());

describe('@Trace decorator with route', () => {
  test('TRACE /api/date', () => {
    const today = new Date().toUTCString();
    return handler.trace('/api/today').set('today', today).expect('today', today).expect(200);
  });
});

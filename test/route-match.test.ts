import { Get, NextApiContext } from 'src';
import { withTestController } from './utils';

class MyController {
  @Get('/hello/:name?')
  sayHelloTo({ request }: NextApiContext) {
    const name = request.params.name;
    if (name == null) {
      return 'Hello World!';
    }

    return `Hello ${name}!`;
  }

  @Get('/media/:title.(mp3|mp4|jpg)')
  media({ request }: NextApiContext) {
    const title = request.params.title;
    return `Media: ${title}`;
  }

  @Get('/any/*')
  any() {
    return 'Match!';
  }

  @Get(/^[/]double[/](?<number>[0-9]+)/)
  doubleNumber({ request }: NextApiContext) {
    const { number = '0' } = request.params;
    return parseInt(number, 10) * 2;
  }

  @Get(new RegExp('/triple/(?<number>(\\d+))'))
  tripleNumber({ request }: NextApiContext) {
    const { number = '0' } = request.params;
    return parseInt(number, 10) * 3;
  }

  @Get(/[/]even[/](?<number>(\d+)*[02468])/)
  even({ request }: NextApiContext) {
    const { number = '0' } = request.params;
    const isEven = parseInt(number, 10) % 2 === 0;
    return { isEven };
  }

  @Get(/[/]even[/](?<number>(\d+)*[13579])/)
  odd({ request }: NextApiContext) {
    const { number = '0' } = request.params;
    const isOdd = parseInt(number, 10) % 2 !== 0;
    return { isOdd };
  }
}

const handler = withTestController(MyController);

afterAll(() => handler.close());

describe('Route pattern matching', () => {
  test('Match optional - GET /api/hello/:name?', async () => {
    await handler.get('/api/hello').expect(200, 'Hello World!');
    await handler.get('/api/hello/Marie').expect(200, 'Hello Marie!');
  });

  test('Match suffix - GET /api/media/:title.(mp3|mp4|jpg)', async () => {
    await handler.get('/api/media/hello.mp4').expect(200, 'Media: hello');
    await handler.get('/api/media/hello.mp3').expect(200, 'Media: hello');
    await handler.get('/api/media/hello.jpg').expect(200, 'Media: hello');
    await handler.get('/api/media/hello.svg').expect(404);
  });

  test('Match any - GET /api/any/*', async () => {
    await handler.get('/api/any/foo/bar').expect(200, 'Match!');
    await handler.get('/api/any/foo/bar/baz').expect(200, 'Match!');
  });

  test('Match literal regex - GET /api/double/:number', async () => {
    await handler.get('/api/double/1').expect(200, '2');
    await handler.get('/api/double/2').expect(200, '4');
    await handler.get('/api/double/3').expect(200, '6');
    await handler.get('/api/double/abc').expect(404);
  });

  test('Match regex - GET /api/triple/:number', async () => {
    await handler.get('/api/triple/1').expect(200, '3');
    await handler.get('/api/triple/2').expect(200, '6');
    await handler.get('/api/triple/3').expect(200, '9');
    await handler.get('/api/triple/xyz').expect(404);
  });

  test('Match similar endpoint - GET /api/even/:number', async () => {
    await handler.get('/api/even/1').expect(200, { isOdd: true });
    await handler.get('/api/even/2').expect(200, { isEven: true });
    await handler.get('/api/even/3').expect(200, { isOdd: true });
    await handler.get('/api/even/4').expect(200, { isEven: true });
    await handler.get('/api/even/abc').expect(404);
  });
});

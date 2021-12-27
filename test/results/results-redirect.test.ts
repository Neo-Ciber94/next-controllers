import { Get, Results } from 'src';
import { withTestController } from 'test/utils';

class MyController {
  @Get('/temporary')
  redirect() {
    return Results.redirect('/message');
  }

  @Get('/permanent')
  redirectPermanent() {
    return Results.redirect('/message', { permanent: true });
  }

  @Get('/message')
  getMessage() {
    return 'Hello World';
  }
}

const handler = withTestController(MyController);

// TODO: Test the redirect result
describe('Results.redirect()', () => {
  test('should redirect temporary (307)', () => {
    return handler.get('/api/temporary').expect(307);
  });

  test('should redirect permanent (308)', () => {
    return handler.get('/api/permanent').expect(308);
  });
});

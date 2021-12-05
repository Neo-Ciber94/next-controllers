import { Get, NextApiContext, RouteController, withController } from 'next-controllers';

@RouteController() // This decorator its optional
class HelloController {
  // GET /api/hello
  @Get()
  sayHello() {
    return 'Hello World';
  }

  // GET /api/hello/:name
  @Get('/:name')
  sayHelloTo({ request }: NextApiContext) {
    return `Hello ${request.params.name}`;
  }
}

// This will create a function that will handle the requests using the `HelloController`
export default withController(HelloController);

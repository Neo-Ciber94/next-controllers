import { Get, NextApiContext, withController } from 'next-controllers';

class HelloController {
  @Get()
  sayHello() {
    return 'Hello World!';
  }

  @Get('/:name')
  sayHelloTo(context: NextApiContext) {
    return `Hello ${context.request.params.name}!`;
  }
}

export default withController(HelloController);

# Next-Controllers

A library for create api routes for `NextJS`.

## Installation

Install with `npm`

```codecopy
npm i next-controllers
```

Or `yarn`

```codecopy
yarn add next-controllers
```

## Setup

1. Add the following to your `next.config.js`. **next-controllers** uses nodejs `__dirname` to find the controller base path, so we need the override the webpack behaviour.

   ```js
   webpack5: true,
   webpack: (config) => {
     config.resolve.fallback = { __dirname: false };
     return config;
   }
   ```

2. Enable decorators in your `tsconfig.ts`:

   ```json
   {
     "experimentalDecorators": true,
     "emitDecoratorMetadata": true
   }
   ```

3. Add or modify a `.babelrc` file with the following content:

   ```json
   {
     "presets": ["next/babel"],
     "plugins": [["@babel/plugin-proposal-decorators", { "legacy": true }], "@babel/plugin-proposal-class-properties"]
   }
   ```

4. Install the `babel` dependencies

   ```codecopy
   npm i -D @babel/plugin-proposal-class-properties @babel/plugin-proposal-decorators
   ```

## Usage

Create a file under `pages/api/` with the pattern: `[[...params]]`
to allow catch all the request.

Define the controller on the route.

```ts
// pages/api/[...hello].ts

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
```

**Request results:**

```bash
curl http://localhost:3000/api
> Hello World!
```

```bash
curl http://localhost:3000/api/Alexandra
> Hello Alexandra!
```

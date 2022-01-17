# Results API

The `Results` API provides a collection of helpers to send http responses
from a `Controller`

## Status codes responses

- `Results.statusCode(statusCode: number, message?: string)` - Returns a response with the given status code and optional message

  ```ts
  @Get('/even')
  async even({ request }: NextApiContext) {
    const n = Number(request.query.value);

    if (n % 2 === 0) {
      return Results.statusCode(200, 'Even');
    }

    return Results.statusCode(400, 'Odd');
  }
  ```

- `Result.ok(message?: string)` - Returns a 200 (OK) response.

  ```ts
  @Get('/health')
  healthCheck() {
    return Results.ok();
  }
  ```

- `Result.created(unknown, string)` - Returns a 201 (Created) response.

  ```ts
  @Post('/users')
  createUser({ request }: NextApiContext) {
    const input = request.body;
    const newUser = await this.userService.create(input);
    return Results.created(newUser, '/users/' + newUser.id);
  }
  ```

- `Results.accepted(message?: string)` - Returns a 202 (Accepted) response.

  ```ts
  @Delete('/videos')
  async deleteVideos() {
    this.videoService.delete({ beforeDate: new Date() });
    return Results.accepted();
  }
  ```

- `Results.noContent(message?: string)` - Returns a 204 (No Content) response.

  ```ts
  @Delete('/user')
  async deleteAccount({ request }: NextApiContext) {
    this.userService.delete(request.body.userId);
    return Results.noContent();
  }
  ```

- `Results.redirect(uri: string, { permanent?: boolean })` - Returns a 308 (Permanent redirect) or 307 (Temporary redirect) response.

  ```ts
  @Get('/login')
  async login({ request }: NextApiContext) {
    await this.userService.login(request.body);
    return Results.redirect('/home', { permanent: true });
  }
  ```

- `Results.badRequest(message?: string)` - Returns a 400 (Bad Request) response.

  ```ts
  @Post('/users')
  createUser({ request }: NextApiContext) {
    if (request.body.name == null) {
      return Results.badRequest('Name is required');
    }

    // Create user...
  }
  ```

- `Results.unauthorized(message?: string)` - Returns a 401 (Unauthorized) response.

  ```ts
  @Post('/login')
  async login({ request }: NextApiContext) {
    const user = await this.userService.login(request.body);

    if (user == null) {
      return Results.unauthorized('Invalid credentials');
    }

    // Login user...
  }
  ```

- `Results.forbidden(message?: string)` - Returns a 403 (Forbidden) response.

  ```ts
  @Get('/users')
  getUsers({request }: NextApiContext) {
    const auth = request.headers.authorization;

    if (!this.userService.isAdmin(auth)) {
      return Results.forbidden('Admin access required');
    }

    // Get users...
  }
  ```

- `Results.notFound(message?: string)` - Returns a 404 (Not Found) response.

  ```ts
  @Get('/users/:id')
  async getUser({ request }: NextApiRequest) {
    const user = await this.userService.findById(request.params.id);

    if (user == null) {
      return Results.notFound('User not found');
    }

    // Get user...
  }
  ```

- `Results.internalServerError(message?: string)` - Returns a 500 (Internal Server Error) response.

  ```ts
  @Get('/users')
  async getUsers() {
    const users = await this.userService.findAll();

    if (users == null) {
      return Results.internalServerError('Error fetching users');
    }

    // Get users...
  }
  ```

## Data responses

- `Results.json(data: T)` - Returns a 200 (OK) response with JSON data.

  ```ts
  @Get('/users')
  async getUsers() {
    const users = await this.userService.findAll();
    return Results.json(users);
  }
  ```

- `Results.text(text: string)` - Returns a 200 (OK) response with `UTF-8` text data.

  ```ts
  @Get('/happy-birthday')
  hello({ request }: NextApiContext) {
    const locale = String(request.query.locale);

    if (locale == 'es') {
      return Results.text('Hola, Feliz cumpleaños!');
    }


    return Results.text("Hello, Happy Birthday!");
  }
  ```

- `Results.file(filePath: string, contentType: string)` - Returns a 200 (OK) response with a file.

  ```ts
  @Get('/pictures/:id')
  async download({ request }: NextApiRequest) {
    const picture = await this.pictureService.findById(request.params.id);
    return Results.file(picture.path, 'image/jpeg');
  }
  ```

- `Results.download(filePath: string, contentType: string, fileName?: string)` - Returns a 200 (OK) response with a file download.

  ```ts
  @Get('/download/:id')
  async download({ request }: NextApiRequest) {
    const picture = await this.pictureService.findById(request.params.id);
    return Results.download(picture.path, 'image/jpeg', picture.name);
  }
  ```

- `Results.bytes(buffer: Buffer)` - Returns a 200 (OK) response with a buffer.

  ```ts
  @Get('/pictures/:id')
  async download({ request }: NextApiRequest) {
    const picture = await this.pictureService.findById(request.params.id);
    const bytes = fs.readFileSync(picture.path);
    return Results.bytes(bytes, 'image/jpeg');
  }
  ```

- `Results.stream(stream: fs.ReadStream)` - Returns a 200 (OK) response with a stream.

  ```ts
  @Get('/pictures/:id')
  async download({ request }: NextApiRequest) {
    const picture = await this.pictureService.findById(request.params.id);
    const stream = fs.createReadStream(picture.path);
    return Results.stream(stream, 'image/jpeg');
  }
  ```

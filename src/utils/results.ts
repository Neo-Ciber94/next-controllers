import fs from 'fs';
import path from 'path';
import { NextApiResponse } from 'next';
import { HTTP_STATUS_CODES } from '.';

/**
 * Represents a handler for an http response.
 */
export abstract class Results {
  /**
   * Creates a response.
   * @param res The response object.
   */
  abstract resolve(res: NextApiResponse): void | Promise<void>;

  /**
   * Creates a `Results` instance from a function.
   * @param fn The function to execute.
   * @returns A result using the given function.
   */
  static fn(fn: (res: NextApiResponse) => any): Results {
    return new (class extends Results {
      resolve(res: NextApiResponse): void | Promise<void> {
        return fn(res);
      }
    })();
  }

  /**
   * Creates a `Result` for a json response.
   * @param data The data to send.
   * @returns A result for a json response.
   */
  static json(data: any): Results {
    return Results.fn((res) => res.json(data));
  }

  /**
   * Creates a `Result` for a text response.
   * @param text The text to send.
   * @returns A result for a text response.
   */
  static text(text: string): Results {
    return Results.fn((res) => res.send(text));
  }

  /**
   * Creates a `Result` for a file response.
   * @param filePath The path of the file relative to the root directory.
   * @param contentType The mime-type of the file.
   * @returns A result for a file.
   */
  static file(filePath: string, contentType: string): Results {
    return new ResultsWithFile(filePath, contentType);
  }

  /**
   * Creates a `Result` for that downloads a file.
   * @param filePath The path of the file relative to the root directory.
   * @param contentType The mime-type of the file.
   * @returns A result for a file download.
   */
  static download(filePath: string, contentType: string, filename?: string): Results {
    return new ResultsWithDownload(filePath, contentType, filename);
  }

  /**
   * Creates a `Result` for a byte stream.
   * @param buffer The stream of bytes to send.
   * @returns A result for a stream.
   */
  static bytes(buffer: Buffer): Results {
    return Results.fn((res) => res.write(buffer));
  }

  /**
   * Creates a `Result` for a byte stream.
   * @param stream The stream of bytes to send.
   * @returns A result for a stream.
   */
  static stream(stream: fs.ReadStream): Results {
    return Results.fn((res) => stream.pipe(res));
  }

  /**
   * Creates a `Result` with a status code.
   * @param statusCode The status code of the response.
   * @param message The custom message, if not specified, the default message is used.
   * @returns A result for a status code.
   */
  static statusCode(statusCode: keyof typeof HTTP_STATUS_CODES, message?: string): Results {
    return new ResultsWithStatusCode(statusCode, message);
  }

  /**
   * Creates a `Result` for a 200 (OK) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 200 (OK) response.
   */
  static ok(message?: string): Results {
    return ResultsWithStatusCode.create(200, message);
  }

  /**
   * Creates a `Result` for a 201 (Created) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 201 (Created) response.
   */
  static created(obj: any, uri: string): Results {
    return new ResultsWithStatusCodeCreated(obj, uri);
  }

  /**
   * Creates a `Result` for a 202 (Accepted) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 202 (Accepted) response.
   */
  static accepted(message?: string): Results {
    return ResultsWithStatusCode.create(202, message);
  }

  /**
   * Creates a `Result` for a 204 (No Content) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 204 (No Content) response.
   */
  static noContent(message?: string): Results {
    return ResultsWithStatusCode.create(204, message);
  }

  /**
   * Creates a `Result` for a 400 (Bad Request) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 400 (Bad Request) response.
   */
  static badRequest(message?: string): Results {
    return ResultsWithStatusCode.create(400, message);
  }

  /**
   * Creates a `Result` for a 401 (Unauthorized) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 401 (Unauthorized) response.
   */
  static unauthorized(message?: string): Results {
    return ResultsWithStatusCode.create(401, message);
  }

  /**
   * Creates a `Result` for a 403 (Forbidden) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 403 (Forbidden) response.
   */
  static forbidden(message?: string): Results {
    return ResultsWithStatusCode.create(403, message);
  }

  /**
   * Creates a `Result` for a 404 (Not Found) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 404 (Not Found) response.
   */
  static notFound(message?: string): Results {
    return ResultsWithStatusCode.create(404, message);
  }

  /**
   * Creates a `Result` for a 500 (Internal Server Error) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 500 (Internal Server Error) response.
   */
  static internalServerError(message?: string): Results {
    return ResultsWithStatusCode.create(500, message);
  }
}

class ResultsWithStatusCode extends Results {
  private static cache = new Map<number, ResultsWithStatusCode>();

  constructor(private readonly statusCode: number, private readonly message?: string) {
    super();
  }

  static create(statusCode: number, message?: string): ResultsWithStatusCode {
    if (message || !(statusCode in HTTP_STATUS_CODES)) {
      return new ResultsWithStatusCode(statusCode, message);
    }

    let result = ResultsWithStatusCode.cache.get(statusCode);

    if (!result) {
      result = new ResultsWithStatusCode(statusCode);
      ResultsWithStatusCode.cache.set(statusCode, result);
    }

    return result;
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    const message = this.message ?? (HTTP_STATUS_CODES as any)[this.statusCode];

    if (message) {
      return res.status(this.statusCode).send(message);
    }

    return res.status(this.statusCode).send(this.message);
  }
}

class ResultsWithStatusCodeCreated extends Results {
  constructor(private readonly obj: any, private readonly uri: string) {
    super();
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    res.setHeader('Location', this.uri);
    return res.status(201).json(this.obj);
  }
}

class ResultsWithFile extends Results {
  constructor(private readonly path: string, private readonly contentType: string) {
    super();
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    const filePath = path.join(process.cwd(), this.path);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    res.setHeader('Content-Type', this.contentType);
    res.status(200);
  }
}

class ResultsWithDownload extends Results {
  constructor(private readonly path: string, private readonly contentType: string, private readonly fileName?: string) {
    super();
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    const filePath = path.join(process.cwd(), this.path);
    const fileName = this.fileName ?? path.basename(filePath);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', this.contentType);
    res.status(200);
  }
}

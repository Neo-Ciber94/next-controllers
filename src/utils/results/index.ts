import fs from 'fs';
import path from 'path';
import { NextApiResponse } from 'next';
import { assertTrue, HTTP_STATUS_CODES } from '..';

/**
 * A callback to resolve a `Results`.
 */
export type ResolveResult<T> = (res: NextApiResponse<T>) => void | Promise<void>;

/**
 * Options used for `Results.redirect()`.
 */
export type RedirectOptions = { permanent?: boolean };

/**
 * Represents a handler for a http response.
 */
export abstract class Results<T = any> {
  /**
   * Sends a response.
   * @param res The response object.
   */
  abstract resolve(res: NextApiResponse<T>): void | Promise<void>;

  /**
   * Creates a `Results` instance from a function.
   * @param resolve The function to execute.
   * @returns A result using the given function.
   */
  static fn<T>(resolve: ResolveResult<T>): Results {
    return new (class extends Results {
      resolve(res: NextApiResponse): void | Promise<void> {
        return resolve(res);
      }
    })();
  }

  /**
   * Creates a `Result` for a 200 (OK) json response.
   * @param data The data to send.
   * @returns A result for a json response.
   */
  static json<T>(data: T): Results<T> {
    return Results.fn((res) => res.json(data));
  }

  /**
   * Creates a `Result` for a 200 (OK) text response.
   * @param text The text to send.
   * @returns A result for a text response.
   */
  static text(text: string): Results {
    return Results.fn((res) => sendText({ res, text }));
  }

  /**
   * Creates a `Result` for a 200 (OK) file response.
   * @param filePath The path of the file relative to the root directory.
   * @param contentType The mime-type of the file.
   * @returns A result for a file.
   */
  static file(filePath: string, contentType: string): Results {
    return new ResultWithFile(filePath, contentType);
  }

  /**
   * Creates a `Result` with a 200 (OK) file download.
   * @param options The options used to send the file.
   * @param contentType The mime-type of the file.
   * @returns A result for a file download.
   */
  static download(options: ResultWithDownloadOptions): Results;

  /**
   * Creates a `Result` with a 200 (OK) file download.
   * @param filePath The path of the file to send.
   * @param contentType The mime-type of the file.
   * @param fileName The name of the file when downloaded.
   */
  static download(filePath: string, contentType: string, fileName?: string): Results;

  static download(
    optionsOrFilePath: string | ResultWithDownloadOptions,
    contentType?: string,
    fileName?: string,
  ): Results {
    if (typeof optionsOrFilePath === 'object') {
      return new ResultWithDownload(optionsOrFilePath);
    }

    assertTrue(contentType, 'contentType is required');
    return new ResultWithDownload({ filePath: optionsOrFilePath, contentType, fileName });
  }

  /**
   * Creates a `Result` for a 200 (OK) byte stream.
   * @param buffer The stream of bytes to send.
   * @param contentType The mime-type of the data.
   * @returns A result for a stream.
   */
  static bytes(buffer: Buffer, contentType: string): Results {
    return new ResultWithBuffer(buffer, contentType);
  }

  /**
   * Creates a `Result` for a 200 (OK) byte stream.
   * @param stream The stream of bytes to send.
   * @param contentType The mime-type of the data.
   * @returns A result for a stream.
   */
  static stream(stream: fs.ReadStream, contentType: string): Results {
    return new ResultWithStream(stream, contentType);
  }

  /**
   * Creates a `Result` with a status code.
   * @param statusCode The status code of the response.
   * @param message The custom message, if not specified, the default message is used.
   * @returns A result for a status code.
   */
  static statusCode(statusCode: keyof typeof HTTP_STATUS_CODES, message?: string): Results {
    return new ResultWithStatusCode(statusCode, message);
  }

  /**
   * Creates a `Result` for a 200 (OK) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 200 (OK) response.
   */
  static ok(message?: string): Results {
    return ResultWithStatusCode.create(200, message);
  }

  /**
   * Creates a `Result` for a 201 (Created) response.
   * @param data The created object.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 201 (Created) response.
   */
  static created(data: unknown, uri: string): Results {
    return new ResultWithStatusCodeCreated(data, uri);
  }

  /**
   * Creates a `Result` for a 202 (Accepted) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 202 (Accepted) response.
   */
  static accepted(message?: string): Results {
    return ResultWithStatusCode.create(202, message);
  }

  /**
   * Creates a `Result` for a 204 (No Content) response.
   * @returns A result for an 204 (No Content) response.
   */
  static noContent(): Results {
    return ResultWithStatusCode.create(204);
  }

  /**
   * Creates a `Result` that redirect to the given uri.
   * @param uri The uri to redirect to.
   * @param options Options used for redirect.
   * @returns A results that redirects to the given uri.
   */
  static redirect(uri: string, options: RedirectOptions = {}): Results {
    return Results.fn((res) => {
      const statusCode = options.permanent === true ? 308 : 307;
      res.redirect(statusCode, uri);
    });
  }

  /**
   * Creates a `Result` for a 400 (Bad Request) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 400 (Bad Request) response.
   */
  static badRequest(message?: string): Results {
    return ResultWithStatusCode.create(400, message);
  }

  /**
   * Creates a `Result` for a 401 (Unauthorized) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 401 (Unauthorized) response.
   */
  static unauthorized(message?: string): Results {
    return ResultWithStatusCode.create(401, message);
  }

  /**
   * Creates a `Result` for a 403 (Forbidden) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 403 (Forbidden) response.
   */
  static forbidden(message?: string): Results {
    return ResultWithStatusCode.create(403, message);
  }

  /**
   * Creates a `Result` for a 404 (Not Found) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 404 (Not Found) response.
   */
  static notFound(message?: string): Results {
    return ResultWithStatusCode.create(404, message);
  }

  /**
   * Creates a `Result` for a 500 (Internal Server Error) response.
   * @param message A custom message, if not specified, the default message is used.
   * @returns A result for an 500 (Internal Server Error) response.
   */
  static internalServerError(message?: string): Results {
    return ResultWithStatusCode.create(500, message);
  }
}

/**
 * Options used for a file download.
 */
export type ResultWithDownloadOptions = {
  /**
   * The path of the file to send.
   */
  filePath: string;

  /**
   * The mime-type of the data.
   */
  contentType: string;

  /**
   * The name of the file when downloaded.
   */
  fileName?: string;
};

class ResultWithStatusCode extends Results {
  private static cache = new Map<number, ResultWithStatusCode>();

  constructor(private readonly statusCode: number, private readonly message?: string) {
    super();
  }

  static create(statusCode: number, message?: string): ResultWithStatusCode {
    if (message || !(statusCode in HTTP_STATUS_CODES)) {
      return new ResultWithStatusCode(statusCode, message);
    }

    let result = ResultWithStatusCode.cache.get(statusCode);

    if (!result) {
      result = new ResultWithStatusCode(statusCode);
      ResultWithStatusCode.cache.set(statusCode, result);
    }

    return result;
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    // Special cases without response body
    // https://nextjs.org/docs/messages/invalid-api-status-body
    if (!this.message && (this.statusCode === 204 || this.statusCode === 304)) {
      return res.status(this.statusCode).end();
    }

    const text = this.message ?? (HTTP_STATUS_CODES as any)[this.statusCode];
    const statusCode = this.statusCode;
    sendText({ res, text, statusCode });
  }
}

class ResultWithStatusCodeCreated extends Results {
  constructor(private readonly obj: any, private readonly uri: string) {
    super();
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    res.setHeader('Location', this.uri);
    return res.status(201).json(this.obj);
  }
}

class ResultWithFile extends Results {
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

class ResultWithDownload extends Results {
  constructor(private readonly options: ResultWithDownloadOptions) {
    super();
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    const filePath = path.join(process.cwd(), this.options.filePath);
    const fileName = this.options.fileName ?? path.basename(filePath);
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);

    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.setHeader('Content-Type', this.options.contentType);
    res.status(200);
  }
}

class ResultWithBuffer extends Results {
  constructor(private readonly buffer: Buffer, private readonly contentType: string) {
    super();
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    res.setHeader('Content-Type', this.contentType);
    res.status(200);
    res.write(this.buffer);
    res.end();
  }
}

class ResultWithStream extends Results {
  constructor(private readonly stream: fs.ReadStream, private readonly contentType: string) {
    super();
  }

  resolve(res: NextApiResponse<any>): void | Promise<void> {
    res.setHeader('Content-Type', this.contentType);
    res.status(200);
    this.stream.pipe(res);
  }
}

function sendText(options: { res: NextApiResponse<any>; text: string; statusCode?: number; encoding?: string }): void {
  const { res, text, statusCode, encoding = 'utf-8' } = options;
  res.setHeader('Content-Type', `text/plain; charset=${encoding}`);
  res.status(statusCode ?? 200).send(text);
}

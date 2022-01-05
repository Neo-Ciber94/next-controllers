/* eslint-disable @typescript-eslint/no-non-null-assertion */

/**
 * Represents an error that occurred while fetching a resource.
 */
export class FetchError extends Error {
  readonly status: number;
  readonly statusText: string;

  constructor(response: Response);
  constructor(status: number, statusText: string, message?: string);
  constructor(statusOrResponse: Response | number, statusText?: string, message?: string) {
    super(message || statusText);

    if (typeof statusOrResponse === 'number') {
      this.status = statusOrResponse;
      this.statusText = statusText!;
    } else {
      this.status = statusOrResponse.status;
      this.statusText = statusText!;
    }
  }
}

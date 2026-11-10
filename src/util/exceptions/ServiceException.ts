// Not an HttpException: the error handler must log this and hide its message
// behind a generic 500.
export class ServiceException extends Error {
  readonly code = "SERVICE_ERROR";

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "ServiceException";
  }
}

export type FieldErrors = Record<string, string[]>;

export class HttpException extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: FieldErrors,
  ) {
    super(message);
    this.name = "HttpException";
  }
}

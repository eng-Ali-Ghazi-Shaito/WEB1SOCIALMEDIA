import { HttpException } from "./HttpException";

export class TooManyRequestsException extends HttpException {
  constructor(message: string) {
    super(429, "TOO_MANY_REQUESTS", message);
    this.name = "TooManyRequestsException";
  }
}

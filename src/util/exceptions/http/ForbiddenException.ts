import { HttpException } from "./HttpException";

export class ForbiddenException extends HttpException {
  constructor(message: string, code = "FORBIDDEN") {
    super(403, code, message);
    this.name = "ForbiddenException";
  }
}

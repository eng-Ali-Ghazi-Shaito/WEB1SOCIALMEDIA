import { HttpException, type FieldErrors } from "./HttpException";

export class BadRequestException extends HttpException {
  constructor(message: string, fields?: FieldErrors) {
    super(400, "BAD_REQUEST", message, fields);
    this.name = "BadRequestException";
  }
}

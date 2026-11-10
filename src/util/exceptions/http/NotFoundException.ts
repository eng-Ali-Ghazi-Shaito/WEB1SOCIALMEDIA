import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException {
  constructor(message: string) {
    super(404, "NOT_FOUND", message);
    this.name = "NotFoundException";
  }
}

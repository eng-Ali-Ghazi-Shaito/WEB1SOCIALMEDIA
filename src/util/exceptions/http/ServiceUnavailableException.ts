import { HttpException } from "./HttpException";

export class ServiceUnavailableException extends HttpException {
  constructor(message = "Service temporarily unavailable") {
    super(503, "SERVICE_UNAVAILABLE", message);
    this.name = "ServiceUnavailableException";
  }
}

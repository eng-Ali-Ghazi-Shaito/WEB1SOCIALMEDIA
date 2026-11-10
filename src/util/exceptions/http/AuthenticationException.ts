import { HttpException } from "./HttpException";

export class AuthenticationException extends HttpException {
  constructor(message: string, code = "AUTHENTICATION_ERROR") {
    super(401, code, message);
    this.name = "AuthenticationException";
  }
}

export class TokenExpiredException extends AuthenticationException {
  constructor() {
    super("Token expired", "TOKEN_EXPIRED");
    this.name = "TokenExpiredException";
  }
}

export class InvalidTokenException extends AuthenticationException {
  constructor() {
    super("Invalid token", "INVALID_TOKEN");
    this.name = "InvalidTokenException";
  }
}

export class AuthenticationFailedException extends AuthenticationException {
  constructor() {
    super("Authentication failed", "AUTHENTICATION_FAILED");
    this.name = "AuthenticationFailedException";
  }
}

// One message for unknown user and wrong password, so a response never reveals
// whether an account exists.
export class InvalidCredentialsException extends AuthenticationException {
  constructor() {
    super("Incorrect email/username or password", "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsException";
  }
}

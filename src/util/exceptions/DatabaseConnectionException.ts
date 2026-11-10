import { RepositoryException } from "./repositoryExceptions";

export class DatabaseConnectionException extends RepositoryException {
  constructor(cause?: unknown) {
    super("Database connection failed", cause, "DATABASE_CONNECTION");
    this.name = "DatabaseConnectionException";
  }
}

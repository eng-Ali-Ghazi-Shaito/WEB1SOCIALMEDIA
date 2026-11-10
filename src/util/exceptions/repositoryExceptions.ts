export class RepositoryException extends Error {
  constructor(
    message: string,
    cause?: unknown,
    public readonly code = "REPOSITORY_ERROR",
  ) {
    super(message, { cause });
    this.name = "RepositoryException";
  }
}

export class UniqueConstraintException extends RepositoryException {
  constructor(message: string, cause?: unknown) {
    super(message, cause, "UNIQUE_CONSTRAINT");
    this.name = "UniqueConstraintException";
  }
}

export class RecordNotFoundException extends RepositoryException {
  constructor(message: string, cause?: unknown) {
    super(message, cause, "RECORD_NOT_FOUND");
    this.name = "RecordNotFoundException";
  }
}

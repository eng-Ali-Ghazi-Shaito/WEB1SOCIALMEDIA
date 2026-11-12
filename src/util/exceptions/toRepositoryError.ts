import { Prisma } from "@/generated/prisma/client";
import { DatabaseConnectionException } from "./DatabaseConnectionException";
import { RepositoryException } from "./repositoryExceptions";

// The pg adapter reports connection failures as request errors as well as initialization errors.
const CONNECTION_ERROR_CODES = new Set([
  "P1000", "P1001", "P1008", "P1011", "P1017", "P2024", "P2037",
]);

export function toRepositoryError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new DatabaseConnectionException(error);
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return CONNECTION_ERROR_CODES.has(error.code)
      ? new DatabaseConnectionException(error)
      : new RepositoryException("Database query failed", error);
  }
  if (
    error instanceof Prisma.PrismaClientUnknownRequestError ||
    error instanceof Prisma.PrismaClientValidationError ||
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    return new RepositoryException("Database query failed", error);
  }
  return error;
}

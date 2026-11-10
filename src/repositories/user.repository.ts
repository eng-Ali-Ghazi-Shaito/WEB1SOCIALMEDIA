import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { RepositoryException } from "@/util/exceptions/repositoryExceptions";

// With the pg adapter a dead database arrives as a known request error (P1001),
// not an initialization error, so the class alone cannot identify it.
const CONNECTION_ERROR_CODES = new Set([
  "P1000", "P1001", "P1008", "P1011", "P1017", "P2024", "P2037",
]);

const credentialsSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  passwordHash: true,
  emailVerifiedAt: true,
} satisfies Prisma.UserSelect;

export type UserCredentials = Prisma.UserGetPayload<{ select: typeof credentialsSelect }>;

function toRepositoryError(error: unknown): unknown {
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

export class UserRepository {
  constructor(private readonly db = prisma) {}

  async findByIdentifier(identifier: string): Promise<UserCredentials | null> {
    // Usernames cannot contain "@" (database CHECK), so this never picks the wrong column.
    const where = identifier.includes("@") ? { email: identifier } : { username: identifier };
    try {
      return await this.db.user.findUnique({ where, select: credentialsSelect });
    } catch (error) {
      throw toRepositoryError(error);
    }
  }
}

export const userRepository = new UserRepository();

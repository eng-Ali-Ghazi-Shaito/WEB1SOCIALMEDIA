import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { toRepositoryError } from "@/util/exceptions/toRepositoryError";

const credentialsSelect = {
  id: true,
  email: true,
  username: true,
  fullName: true,
  passwordHash: true,
  emailVerifiedAt: true,
} satisfies Prisma.UserSelect;

export type UserCredentials = Prisma.UserGetPayload<{ select: typeof credentialsSelect }>;

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

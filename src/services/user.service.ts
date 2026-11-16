import { userRepository, type UserRepository } from "@/repositories/user.repository";
import type { MyAccount } from "@/types/user.types";
import { DatabaseConnectionException } from "@/util/exceptions/DatabaseConnectionException";
import { AuthenticationFailedException } from "@/util/exceptions/http/AuthenticationException";
import { ServiceUnavailableException } from "@/util/exceptions/http/ServiceUnavailableException";

export class UserService {
  constructor(private readonly users: Pick<UserRepository, "findMe"> = userRepository) {}

  async getMe(userId: string): Promise<MyAccount> {
    try {
      const me = await this.users.findMe(userId);
      // The token is signed and unexpired, but the account behind it is gone: the same answer as no token.
      if (!me) throw new AuthenticationFailedException();
      // Dates leave this layer as ISO strings, so every endpoint sends the same format.
      return { ...me, createdAt: me.createdAt.toISOString() };
    } catch (error) {
      if (error instanceof DatabaseConnectionException) {
        throw new ServiceUnavailableException("Database temporarily unavailable");
      }
      throw error;
    }
  }
}

export const userService = new UserService();

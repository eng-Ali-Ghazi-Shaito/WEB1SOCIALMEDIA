import { verify } from "argon2";
import { errors, jwtVerify, SignJWT, type JWTPayload } from "jose";

import { authConfig } from "@/config/auth.config";
import { userRepository, type UserRepository } from "@/repositories/user.repository";
import type { LoginDto, LoginResult, TokenPayload } from "@/types/auth.types";
import {
  InvalidCredentialsException,
  InvalidTokenException,
  TokenExpiredException,
} from "@/util/exceptions/http/AuthenticationException";
import { ForbiddenException } from "@/util/exceptions/http/ForbiddenException";
import { ServiceException } from "@/util/exceptions/ServiceException";
import { logger } from "@/util/logger";

// Hash of random bytes nobody knows. Its parameters must match real hashes,
// or unknown users would still be detectable by response time.
const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$58MMBPATD4YV8U3eEOp7og$gaV5iwVQjQqtrIDOTG0CJZgtlq+J8WTUaqKBBiXqg8A";

export class AuthenticationService {
  private readonly key: Uint8Array;

  constructor(
    secret = authConfig.jwtSecret,
    private readonly expiresIn = authConfig.jwtExpiresIn,
    private readonly users: Pick<UserRepository, "findByIdentifier"> = userRepository,
  ) {
    this.key = new TextEncoder().encode(secret);
  }
//async always return promise and is unblocking.
//promise is object that can be pending,fullfilled,failure and need time so if fullfilled run .then else if failure runs .catch else neither runs finally and the promise.resolve/promise.reject are prepared values for then and catch
  async generateToken(userId: string): Promise<string> {
    //no need for await because not use its value or await to get id to use it in the function 
    return new SignJWT({ userId })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(this.expiresIn)
      .sign(this.key);
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    const payload = await this.verifySignature(token);
    // Outside verifySignature's try: its catch would turn this 401 into a 500.
    if (typeof payload.userId !== "string" || payload.userId.length === 0) {
      throw new InvalidTokenException();
    }
    return payload as TokenPayload;
  }
  //data transfer object
  //loginDTO is the infer of the zod validation of identifier and password. 
  async login(dto: LoginDto): Promise<LoginResult> {
    const user = await this.users.findByIdentifier(dto.identifier);
    // Unknown users run the same Argon2 check, so timing does not reveal who has an account.
    const passwordMatches = await verify(user?.passwordHash ?? DUMMY_PASSWORD_HASH, dto.password);
    if (!user || !passwordMatches) {
      //The email/username or password is incorrect.
      throw new InvalidCredentialsException();
    }
    // Checked after the password, so only the owner can learn the account is unverified.
    // this sends verification link to the user email.
    if (!user.emailVerifiedAt) {
      //The credentials are correct, but the user isn't allowed to proceed yet
      throw new ForbiddenException("Email not verified", "EMAIL_NOT_VERIFIED");
    }
    return {
      accessToken: await this.generateToken(user.id),
      expiresIn: this.expiresIn,
      user: { id: user.id, username: user.username, fullName: user.fullName },
    };
  }

  async logout(userId: string): Promise<void> {
    // TRADE-OFF: a stateless JWT stays valid until it expires, so the client must
    // delete it. Real revocation arrives with the refresh-token/sessions step.
    logger.info(`User ${userId} logged out`, "logout");
  }

  private async verifySignature(token: string): Promise<JWTPayload> {
    try {
      // Pinned so the token's own header cannot choose how it is verified
      // (algorithm-confusion attack).
      const { payload } = await jwtVerify(token, this.key, { algorithms: ["HS256"] });
      return payload;
    } catch (error) {
      // JWTExpired first: it is also a JOSEError, so the order decides the response.
      if (error instanceof errors.JWTExpired) throw new TokenExpiredException();
      if (error instanceof errors.JOSEError) throw new InvalidTokenException();
      logger.error("Token verification failed", error, "token_verification_failed");
      throw new ServiceException("Token verification failed", error);
    }
  }
}

export const authenticationService = new AuthenticationService();

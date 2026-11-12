import { argon2id, hash, verify } from "argon2";
import { SignJWT } from "jose";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import type { UserCredentials } from "@/repositories/user.repository";
import {
  InvalidCredentialsException,
  InvalidTokenException,
  TokenExpiredException,
} from "@/util/exceptions/http/AuthenticationException";
import { ForbiddenException } from "@/util/exceptions/http/ForbiddenException";
import { AuthenticationService } from "./Authentication.service";

vi.mock("argon2", { spy: true });

const SECRET = "unit-test-secret-with-at-least-32-characters";
const OTHER_SECRET = "another-test-secret-with-at-least-32-characters";
const PASSWORD = "Correct horse 1!";
const CREDENTIALS_MESSAGE = "Incorrect email/username or password";
const dto = { identifier: "ali_test", password: PASSWORD };

let passwordHash: string;

function createService(user: UserCredentials | null = null) {
  return new AuthenticationService(SECRET, "1h", { findByIdentifier: async () => user });
}

function createUser(emailVerifiedAt: Date | null = new Date()): UserCredentials {
  return {
    id: "user-1",
    email: "ali@test.com",
    username: "ali_test",
    fullName: "Ali Test",
    passwordHash,
    emailVerifiedAt,
  };
}

function signToken(claims: Record<string, unknown>, secret = SECRET, expiresAt: number | string = "1h") {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .sign(new TextEncoder().encode(secret));
}

beforeAll(async () => {
  passwordHash = await hash(PASSWORD, { type: argon2id });
});

beforeEach(() => {
  vi.mocked(verify).mockClear();
});

describe("tokens", () => {
  it("verifyToken returns the userId given to generateToken", async () => {
    const service = createService();
    const payload = await service.verifyToken(await service.generateToken("user-1"));
    expect(payload.userId).toBe("user-1");
  });

  it("rejects an expired token", async () => {
    const pastSeconds = Math.floor(Date.now() / 1000) - 60;
    const token = await signToken({ userId: "user-1" }, SECRET, pastSeconds);
    await expect(createService().verifyToken(token)).rejects.toBeInstanceOf(TokenExpiredException);
  });

  it("rejects a tampered token", async () => {
    const [header, , signature] = (await signToken({ userId: "user-1" })).split(".");
    const forged = Buffer.from(JSON.stringify({ userId: "attacker" })).toString("base64url");
    await expect(
      createService().verifyToken(`${header}.${forged}.${signature}`),
    ).rejects.toBeInstanceOf(InvalidTokenException);
  });

  it("rejects a token signed with another secret", async () => {
    const token = await signToken({ userId: "user-1" }, OTHER_SECRET);
    await expect(createService().verifyToken(token)).rejects.toBeInstanceOf(InvalidTokenException);
  });

  it("rejects a correctly signed token without userId", async () => {
    const token = await signToken({});
    await expect(createService().verifyToken(token)).rejects.toBeInstanceOf(InvalidTokenException);
  });
});

describe("login", () => {
  it("rejects an unknown user and still runs the Argon2 check", async () => {
    const attempt = createService(null).login(dto);
    await expect(attempt).rejects.toBeInstanceOf(InvalidCredentialsException);
    await expect(attempt).rejects.toThrow(CREDENTIALS_MESSAGE);
    expect(verify).toHaveBeenCalledOnce();
  });

  it("rejects a wrong password with the same message", async () => {
    const attempt = createService(createUser()).login({ ...dto, password: "wrong" });
    await expect(attempt).rejects.toBeInstanceOf(InvalidCredentialsException);
    await expect(attempt).rejects.toThrow(CREDENTIALS_MESSAGE);
  });

  it("rejects an unverified user", async () => {
    const attempt = createService(createUser(null)).login(dto);
    await expect(attempt).rejects.toBeInstanceOf(ForbiddenException);
    await expect(attempt).rejects.toMatchObject({ code: "EMAIL_NOT_VERIFIED" });
  });

  it("returns a token and a user without passwordHash or email", async () => {
    const service = createService(createUser());
    const result = await service.login(dto);
    expect(result.user).toEqual({ id: "user-1", username: "ali_test", fullName: "Ali Test" });
    expect(result.expiresIn).toBe("1h");
    expect(JSON.stringify(result)).not.toContain("ali@test.com");
    expect(JSON.stringify(result)).not.toContain(passwordHash);
    const payload = await service.verifyToken(result.accessToken);
    expect(payload.userId).toBe("user-1");
  });
});

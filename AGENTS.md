# WEB1 Social Media Platform — Project Rules

Instagram-style back end: email sign-up with verification codes, JWT login, password reset,
profiles, search, follow, image posts, feed, likes, real-time 1:1 chat, notifications.
University project built to production standards. The back end and database are graded;
the UI is only for testing.

## Scope

- Exactly 18 REST endpoints (listed below). Never add one without asking first.
- Real-time features use Socket.io events, not new endpoints.
- Out of scope: comments, block, edit profile, followers/following lists, Google sign-in,
  private accounts, group chat, calls, stories.
- We build feature by feature. Only build what the current prompt asks for.

## Stack

Next.js 16 (App Router, TypeScript, `src/`) · Prisma ORM 7 + PostgreSQL (`@prisma/adapter-pg`)
· Zod 4 · jose (JWT) · argon2 (password hashing) · Socket.io on a custom server (`server.ts`)
· nodemailer · Cloudinary · Vitest · Railway.

## Always check the current docs — never rely on training data

Training data describes older versions. The installed version's docs always win.

1. Read the installed versions in `package.json` before using any framework API.
2. Next.js: read the matching page in `node_modules/next/dist/docs/`, or https://nextjs.org/docs.
3. Prisma: read the Prisma 7 docs at https://www.prisma.io/docs.
4. Zod: read the v4 docs at https://zod.dev. jose: read https://github.com/panva/jose.
5. In every plan, name the doc page used for each framework API.
6. If the docs contradict what you remember, follow the docs and say what changed.
7. Never use deprecated APIs. Known changes:
   - Next.js 16: `middleware.ts` is now `proxy.ts`; route `params` and `cookies()` are async.
   - Prisma 7: config in `prisma7.config.ts`, driver adapter `@prisma/adapter-pg`, client in
     `src/generated/prisma`, `.env` loaded with `dotenv`.
8. If the docs don't answer it, say so and stop. Never guess an API.

## Architecture (strict layers)

Every request, in this order:

```
route.ts → middleware (auth) → controller → service → repository → database
```

| Layer | Folder | Does | Never |
|---|---|---|---|
| Route | `src/app/api/**/route.ts` | Export the HTTP method: the controller method wrapped in `withErrorHandler`, plus `authenticate` when protected | Logic, validation, Prisma |
| Middleware | `src/middleware/` | `withErrorHandler` (exceptions → JSON), `authenticate` (Bearer token → `req.userId`) | Repositories, Prisma |
| Controller | `src/controllers/` | Read the request, validate with Zod, call ONE service method, return `NextResponse` with the status | Business rules, Prisma |
| Service | `src/services/` | ALL business rules; call repositories; throw exceptions | Prisma, `NextRequest`, `NextResponse` |
| Repository | `src/repositories/` | The ONLY layer using Prisma; explicit `select`; turn Prisma errors into repository exceptions | Business rules, HTTP |
| Validation | `src/validations/` | Zod schemas | Logic |
| Types | `src/types/` | `TokenPayload`, `AuthRequest`, DTOs (`z.infer`) | Runtime code |
| Config | `src/config/` | Read and validate `process.env` once with Zod; export typed config | Business rules |
| Exceptions | `src/util/exceptions/` | `HttpException` family, `ServiceException`, repository exceptions | — |
| Logger | `src/util/logger.ts` | `info`, `warn`, `error` | Logging secrets or tokens |

```
src/
  app/api/...                 route.ts only
  middleware/                 errorHandler.ts, auth.ts
  controllers/                auth.controller.ts, ...
  services/                   Authentication.service.ts, ...
  repositories/               user.repository.ts, ...
  validations/                auth.schema.ts, ...
  types/                      auth.types.ts, ...
  config/                     env.ts, auth.config.ts
  util/
    logger.ts
    exceptions/
      http/                   HttpException.ts, AuthenticationException.ts, BadRequestException.ts,
                              ForbiddenException.ts, NotFoundException.ts
      ServiceException.ts
      repositoryExceptions.ts
      DatabaseConnectionException.ts
  lib/prisma.ts
  generated/prisma/           Prisma output — never edit
server.ts
```

- Services and repositories are classes. Each file exports one singleton instance. Constructors
  take their dependencies with defaults, so tests can pass fakes (Dependency Inversion).
- Controller methods are arrow functions, so `this` is never lost when passed to a route.
- Only `withErrorHandler` turns exceptions into responses: `HttpException` → its status and
  `{ error: { code, message, fields? } }`; anything else → logged, then 500 "Internal server error".
- Only `src/config/env.ts` reads `process.env`. Never use the `NEXT_PUBLIC_` prefix for secrets.
- Never put auth in Next.js `proxy.ts`. Auth runs in the route wrapper.

## SOLID and best practices

- **S:** one job per file; split any file past ~200 lines.
- **O:** add behavior with new functions or classes, not new `if` branches in old code.
- **L:** test fakes behave exactly like the real repository.
- **I:** services depend only on the repository methods they use.
- **D:** dependencies are passed through constructors with defaults.
- Limits (5 attempts, 10 min, 50 per page) live in one constants file — no magic numbers.
- No `any`, no unused code, no leftover `console.log`, no swallowed errors.
- Explicit Prisma `select` always; never return a whole row.

## Security

- Passwords: Argon2id (`argon2`). Codes: HMAC-SHA256 with `CODE_HMAC_SECRET`, single use, 10 min,
  max 5 attempts, compared with `timingSafeEqual`.
- JWT: HS256 with `jose`, algorithm pinned on verify. Sent as `Authorization: Bearer <token>`.
  Lifetime from `JWT_EXPIRES_IN` (1h now; 15 min once refresh tokens exist).
- Login: same error for unknown user and wrong password, with a dummy Argon2 check so timing matches.
- Never return `email` (except `GET /api/users/me`), password hashes or codes.
- Uniqueness rules are enforced by database constraints.
- Lists use cursor pagination on (`createdAt`, `id`), max 50.
- Chat: save the message BEFORE emitting it.

## Data and concurrency rules

- Never read-then-write a counter or status. Use one atomic UPDATE with the condition in WHERE and check the affected row count (code attempts: attempts + 1 WHERE attempts < 5; code use: used_at = now() WHERE used_at IS NULL, exactly 1 row).
- Issuing a new code deletes the old unused code of the same purpose in the same transaction.
- First message: create the conversation and the message in ONE transaction.
- conversations.last_message_at and last_read_at only move forward: GREATEST(current, new) via raw SQL.
- conversation:read stores the createdAt of the last message the client displayed, not now().
- A retried clientMessageId from another conversation is rejected.
- Lowercase both UUID strings before ordering a conversation pair.
- Notifications are upserted; notification:read marks up to a createdAt.
- Every Zod string rejects "\u0000" through one shared helper.
- prisma migrate dev runs only against the development database; production deployments run prisma migrate deploy and never migrate dev.

## The 18 endpoints

1 POST /api/auth/signup · 2 POST /api/auth/verify-email · 3 POST /api/auth/login ·
4 POST /api/auth/logout · 5 POST /api/auth/forgot-password · 6 POST /api/auth/reset-password ·
7 GET /api/users/me · 8 GET /api/users?q= · 9 GET /api/users/:username ·
10 PUT /api/users/:id/follow · 11 POST /api/posts · 12 DELETE /api/posts/:id · 13 GET /api/feed ·
14 PUT /api/posts/:id/like · 15 GET /api/conversations · 16 GET /api/conversations/:id/messages ·
17 GET /api/notifications · 18 POST /api/auth/refresh

Socket events: message:send, message:new, typing, conversation:read, conversation:seen,
notification:new, notification:read.

## Comments: WHY, never WHAT

Comment the decision, trade-off or bug it prevents — never what the syntax already says.

```ts
// Bad:  // Hash the password
// Good: // Argon2id over bcrypt: memory-hard, so brute-forcing a leaked DB on GPUs costs far more.
```

Mark known shortcuts with `// TRADE-OFF:` and the reason.

## Commands

```bash
npm run dev                          # custom server (Next.js, Socket.io later)
npx prisma migrate dev --name <name> # create + apply a migration
npx prisma generate                  # regenerate the client
npx prisma db seed                   # load test data
npx tsc --noEmit                     # type check
npm test
```
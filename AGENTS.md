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
  middleware/                 errorHandler.ts,
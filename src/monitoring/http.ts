import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";

import type { MonitoringEvent, RequestContext } from "./events";

const staticRoutes = new Set([
  "/", "/login", "/logout", "/signup", "/verify-email", "/forgot-password", "/reset-password",
  "/feed", "/search", "/posts/new", "/conversations", "/notifications",
  "/api/auth/login", "/api/auth/logout", "/api/auth/signup", "/api/auth/verify-email",
  "/api/auth/forgot-password", "/api/auth/reset-password", "/api/auth/refresh",
  "/api/users", "/api/users/me", "/api/posts", "/api/feed", "/api/conversations", "/api/notifications",
]);

const dynamicRoutes = [
  [/^\/users\/[^/]+$/, "/users/:username"],
  [/^\/conversations\/[^/]+$/, "/conversations/:id"],
  [/^\/api\/users\/[^/]+$/, "/api/users/:username"],
  [/^\/api\/users\/[^/]+\/follow$/, "/api/users/:id/follow"],
  [/^\/api\/posts\/[^/]+$/, "/api/posts/:id"],
  [/^\/api\/posts\/[^/]+\/like$/, "/api/posts/:id/like"],
  [/^\/api\/conversations\/[^/]+\/messages$/, "/api/conversations/:id/messages"],
] as const;

export function routeLabel(url: string | undefined) {
  const pathname = url?.split("?", 1)[0].replace(/\/$/, "") || "/";
  if (pathname.startsWith("/_next/") || pathname === "/favicon.ico") return undefined;
  if (staticRoutes.has(pathname)) return pathname;
  return dynamicRoutes.find(([pattern]) => pattern.test(pathname))?.[1]
    ?? (pathname.startsWith("/api/") ? "/api/*" : "other");
}

export function trackRequest(
  req: IncomingMessage,
  res: ServerResponse,
  record: (event: MonitoringEvent, context: RequestContext) => void,
) {
  const route = routeLabel(req.url);
  if (route === undefined) return undefined;

  const context = { route, request_id: randomUUID() };
  const started = performance.now();
  res.setHeader("X-Request-Id", context.request_id);
  res.once("close", () => {
    const status = res.headersSent ? res.statusCode : undefined;
    let outcome: Extract<MonitoringEvent, { event_type: "http" }>["outcome"] = "completed";
    if (!res.writableFinished) outcome = "aborted";
    else if (res.statusCode >= 500) outcome = "server_error";
    else if (res.statusCode >= 400) outcome = "client_error";

    record({
      event_type: "http",
      method: req.method ?? "UNKNOWN",
      status_code: status,
      outcome,
      duration_ms: performance.now() - started,
    }, context);
  });
  return context;
}

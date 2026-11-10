import type { NextRequest } from "next/server";

import { env } from "@/config/env";
import type { RouteHandler } from "@/types/http.types";
import { ForbiddenException } from "@/util/exceptions/http/ForbiddenException";

const APP_ORIGIN = new URL(env.APP_URL).origin;
const SAFE_METHODS = new Set(["GET", "HEAD"]);

// Cookies are sent automatically, so a page on another site could make the browser call our API.
// Browsers always add an Origin header to such requests; we reject any that isn't our own site.
// A missing Origin means a non-browser client (curl, PowerShell), which can't carry a victim's cookie.
export function requireSameOrigin<Req extends NextRequest, Ctx>(
  handler: RouteHandler<Req, Ctx>,
): RouteHandler<Req, Ctx> {
  return async (req, context) => {
    const origin = req.headers.get("origin");
    if (!SAFE_METHODS.has(req.method) && origin !== null && origin !== APP_ORIGIN) {
      throw new ForbiddenException("Cross-site request blocked", "CSRF_BLOCKED");
    }
    return handler(req, context);
  };
}
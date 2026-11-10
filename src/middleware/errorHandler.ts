import { NextResponse, type NextRequest } from "next/server";

import type { RouteHandler } from "@/types/http.types";
import { HttpException } from "@/util/exceptions/http/HttpException";
import { logger } from "@/util/logger";

export function withErrorHandler<Req extends NextRequest, Ctx>(
  handler: RouteHandler<Req, Ctx>,
): RouteHandler<Req, Ctx> {
  return async (req, context) => {
    try {
      return await handler(req, context);
    } catch (error) {
      //known errors like Invalid request body/Incorrect credentials/Unverified email/Invalid or expired token.

      if (error instanceof HttpException) {
        const { code, message, fields, status } = error;
        return NextResponse.json({ error: { code, message, fields } }, { status });
      }
      // Details go to the log only: stack traces and Prisma messages expose internals.
      //unexpected errors shown in logger.
      logger.error("Unhandled request error", error);
      return NextResponse.json(
        { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
        { status: 500 },
      );
    }
  };
}

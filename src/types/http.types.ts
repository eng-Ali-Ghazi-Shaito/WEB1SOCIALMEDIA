import type { NextRequest } from "next/server";

export type RouteHandler<Req extends NextRequest = NextRequest, Ctx = unknown> = (
  req: Req,
  context: Ctx,
) => Response | Promise<Response>;

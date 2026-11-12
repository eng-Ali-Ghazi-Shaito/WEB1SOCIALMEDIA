import { feedController } from "@/controllers/feed.controller";
import { authenticate } from "@/middleware/auth";
import { withErrorHandler } from "@/middleware/errorHandler";

export const GET = withErrorHandler(authenticate(feedController.getFeed));

import { postLikeController } from "@/controllers/post-like.controller";
import { authenticate } from "@/middleware/auth";
import { withErrorHandler } from "@/middleware/errorHandler";
import { requireSameOrigin } from "@/middleware/sameOrigin";

export const PUT = withErrorHandler(
  requireSameOrigin(authenticate(postLikeController.setLike)),
);

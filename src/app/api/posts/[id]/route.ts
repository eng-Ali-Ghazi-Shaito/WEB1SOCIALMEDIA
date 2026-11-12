import { postController } from "@/controllers/post.controller";
import { authenticate } from "@/middleware/auth";
import { withErrorHandler } from "@/middleware/errorHandler";
import { requireSameOrigin } from "@/middleware/sameOrigin";

export const DELETE = withErrorHandler(
  requireSameOrigin(authenticate(postController.deletePost)),
);

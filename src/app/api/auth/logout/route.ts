import { authController } from "@/controllers/auth.controller";
import { authenticate } from "@/middleware/auth";
import { withErrorHandler } from "@/middleware/errorHandler";

export const POST = withErrorHandler(authenticate(authController.logout));

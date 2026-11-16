import { userController } from "@/controllers/user.controller";
import { authenticate } from "@/middleware/auth";
import { withErrorHandler } from "@/middleware/errorHandler";

export const GET = withErrorHandler(authenticate(userController.getMe));

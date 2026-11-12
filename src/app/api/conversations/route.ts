import { conversationController } from "@/controllers/conversation.controller";
import { authenticate } from "@/middleware/auth";
import { withErrorHandler } from "@/middleware/errorHandler";

export const GET = withErrorHandler(authenticate(conversationController.listConversations));

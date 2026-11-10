import { authController } from "@/controllers/auth.controller";
import { withErrorHandler } from "@/middleware/errorHandler";
import { requireSameOrigin } from "@/middleware/sameOrigin";

//chain of responisibility reduces coupling and  each layer do not know the internal code of other layer.


//a route handler is  a function that recieves http request here post

//every error through the login is returned to main errorhandler and converted into an appropriate HTTP response.
export const POST = withErrorHandler(requireSameOrigin(authController.login));

//login the function is passed , login() the function is executed.

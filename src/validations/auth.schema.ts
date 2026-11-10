import { z } from "zod";

import { IDENTIFIER_MAX_LENGTH, PASSWORD_MAX_LENGTH } from "@/config/constants";
import { safeString } from "./common";

export const loginSchema = z.strictObject({
  // Trim comes first so "   " fails min(1). Lowercase because emails and
  // usernames are stored lowercase.
  identifier: safeString().trim().toLowerCase().min(1).max(IDENTIFIER_MAX_LENGTH),
  // Never trimmed: spaces are part of a password.
  password: safeString().min(8).max(PASSWORD_MAX_LENGTH),
});

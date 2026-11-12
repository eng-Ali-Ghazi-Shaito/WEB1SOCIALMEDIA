import { z } from "zod";

import { safeString } from "./common";

export const postIdParamsSchema = z.strictObject({
  id: safeString().pipe(z.uuid()).transform((id) => id.toLowerCase()),
});

export const setPostLikeSchema = z.strictObject({
  liked: z.boolean(),
});

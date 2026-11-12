import { z } from "zod";

import { timestampCursorPartsSchema } from "./common";

const conversationCursorSchema = timestampCursorPartsSchema
  .transform(([lastMessageAt, id]) => ({ lastMessageAt: new Date(lastMessageAt), id }));

export const conversationQuerySchema = z.strictObject({
  cursor: conversationCursorSchema.optional(),
});

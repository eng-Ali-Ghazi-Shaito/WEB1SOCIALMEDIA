import { z } from "zod";

import { timestampCursorPartsSchema } from "./common";

const feedCursorSchema = timestampCursorPartsSchema
  .transform(([createdAt, id]) => ({ createdAt: new Date(createdAt), id }));

export const feedQuerySchema = z.strictObject({
  cursor: feedCursorSchema.optional(),
});

import { z } from "zod";

// PostgreSQL text cannot store "\u0000": without this check the input would
// pass validation and fail as a 500 inside the database.
export const safeString = () =>
  z.string().refine((value) => !value.includes("\u0000"), "Must not contain a null character");

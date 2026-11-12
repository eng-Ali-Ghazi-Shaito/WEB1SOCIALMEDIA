import { z } from "zod";

import type { FieldErrors } from "@/util/exceptions/http/HttpException";

// PostgreSQL text cannot store "\u0000": without this check the input would
// pass validation and fail as a 500 inside the database.
export const safeString = () =>
  z.string().refine((value) => !value.includes("\u0000"), "Must not contain a null character");

export const timestampCursorPartsSchema = safeString()
  .transform((value) => value.split("_"))
  .pipe(z.tuple([z.iso.datetime({ precision: 3 }), z.guid()]));

export function toFieldErrors(error: z.ZodError): FieldErrors {
  const { formErrors, fieldErrors } = z.flattenError(error);
  return formErrors.length > 0 ? { ...fieldErrors, _form: formErrors } : fieldErrors;
}

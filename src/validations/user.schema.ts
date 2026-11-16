import { z } from "zod";

import { SEARCH_QUERY_MAX_LENGTH } from "@/config/constants";
import { safeString } from "./common";

export const userSearchQuerySchema = z.strictObject({
  // trim awwal shi, la ykun "   " yefshal 3a min(1).
  // toLowerCase la2an el usernames ma7fuza bel database bi 7uruf zghire.
  q: safeString().trim().toLowerCase().min(1).max(SEARCH_QUERY_MAX_LENGTH),
});
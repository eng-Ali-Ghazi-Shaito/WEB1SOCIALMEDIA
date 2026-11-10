import { describe, expect, it } from "vitest";

import { safeString } from "./common";

describe("safeString", () => {
  it("rejects a string containing the null character", () => {
    expect(safeString().safeParse("ab\u0000c").success).toBe(false);
  });

  it("accepts a normal string", () => {
    expect(safeString().safeParse("abc").success).toBe(true);
  });
});

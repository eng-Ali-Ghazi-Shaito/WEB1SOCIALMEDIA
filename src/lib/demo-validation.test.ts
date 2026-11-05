import { describe, expect, it } from "vitest";
import {
  characterCount,
  isAcceptedImage,
  isValidDemoUsername,
  isValidPasswordLength,
  MAX_IMAGE_BYTES,
} from "./demo-validation";

describe("frontend demo validation", () => {
  it("accepts valid usernames and rejects invalid dot placement", () => {
    expect(isValidDemoUsername("maya_chen")).toBe(true);
    expect(isValidDemoUsername("_maya.chen")).toBe(true);
    expect(isValidDemoUsername(".maya")).toBe(false);
    expect(isValidDemoUsername("maya.")).toBe(false);
    expect(isValidDemoUsername("maya..chen")).toBe(false);
    expect(isValidDemoUsername("Maya")).toBe(false);
  });

  it("enforces the documented password length range", () => {
    expect(isValidPasswordLength("12345678")).toBe(true);
    expect(isValidPasswordLength("x".repeat(128))).toBe(true);
    expect(isValidPasswordLength("1234567")).toBe(false);
    expect(isValidPasswordLength("x".repeat(129))).toBe(false);
  });

  it("counts emoji as one user-perceived code point", () => {
    expect(characterCount("hi 🌿")).toBe(4);
  });

  it("accepts only supported image formats within the size limit", () => {
    expect(isAcceptedImage({ type: "image/png", size: MAX_IMAGE_BYTES })).toBe(true);
    expect(isAcceptedImage({ type: "image/gif", size: 12 })).toBe(false);
    expect(isAcceptedImage({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 })).toBe(
      false,
    );
  });
});

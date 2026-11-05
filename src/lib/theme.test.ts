import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_THEME, readSavedTheme, saveTheme } from "./theme";

function stubStorage(saved: string | null) {
  const setItem = vi.fn();
  vi.stubGlobal("localStorage", { getItem: () => saved, setItem });
  return setItem;
}

describe("theme preference", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts in light mode", () => {
    expect(DEFAULT_THEME).toBe("light");
  });

  it("uses light when nothing is saved", () => {
    stubStorage(null);
    expect(readSavedTheme()).toBe("light");
  });

  it("restores a saved dark choice", () => {
    stubStorage("dark");
    expect(readSavedTheme()).toBe("dark");
  });

  it("ignores an unknown saved value", () => {
    stubStorage("purple");
    expect(readSavedTheme()).toBe("light");
  });

  it("falls back to light when storage is blocked", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("blocked");
      },
    });
    expect(readSavedTheme()).toBe("light");
  });

  it("saves the chosen theme", () => {
    const setItem = stubStorage(null);
    saveTheme("dark");
    expect(setItem).toHaveBeenCalledWith("theme", "dark");
  });

  it("does not throw when saving is blocked", () => {
    vi.stubGlobal("localStorage", {
      setItem: () => {
        throw new Error("blocked");
      },
    });
    expect(() => saveTheme("dark")).not.toThrow();
  });
});

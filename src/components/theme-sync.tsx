"use client";

import { useEffect, useLayoutEffect } from "react";
import { syncThemeFromStorage } from "@/components/use-theme";

export function ThemeSync() {
  // Strict Mode's dev remount resets <html> to its JSX attributes, wiping what the inline
  // script set. Layout effect, not effect, so the correction lands before paint.
  useLayoutEffect(syncThemeFromStorage, []);

  // The storage event only fires in other tabs, so this keeps every open tab on one theme.
  useEffect(() => {
    window.addEventListener("storage", syncThemeFromStorage);
    return () => window.removeEventListener("storage", syncThemeFromStorage);
  }, []);

  return null;
}

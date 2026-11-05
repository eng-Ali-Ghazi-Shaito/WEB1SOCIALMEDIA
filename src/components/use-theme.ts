"use client";

import { useSyncExternalStore } from "react";
import { applyTheme, DEFAULT_THEME, readSavedTheme, saveTheme, type Theme } from "@/lib/theme";

const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// <html> is the single source of truth: the sidebar and profile menus can be mounted
// together, and separate useState copies would let their switches disagree.
function getTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : DEFAULT_THEME;
}

function getServerTheme(): Theme {
  return DEFAULT_THEME;
}

export function setTheme(theme: Theme) {
  applyTheme(theme);
  saveTheme(theme);
  notifyListeners();
}

export function syncThemeFromStorage() {
  applyTheme(readSavedTheme());
  notifyListeners();
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getTheme, getServerTheme);
}

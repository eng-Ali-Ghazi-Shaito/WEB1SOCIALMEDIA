export type Theme = "light" | "dark";

export const DEFAULT_THEME: Theme = "light";

const STORAGE_KEY = "theme";

const BROWSER_BAR_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#000000",
};

// Runs while the HTML is parsed, before the first paint. Applying the theme from React
// instead would show every dark-mode user a white flash on each refresh.
export const THEME_INIT_SCRIPT = `(function(){try{if(localStorage.getItem("${STORAGE_KEY}")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})()`;

export function readSavedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : DEFAULT_THEME;
  } catch {
    // Storage can be blocked by browser privacy settings; the default theme is the correct fallback.
    return DEFAULT_THEME;
  }
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // TRADE-OFF: with blocked storage the theme still changes, it just isn't remembered.
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  // Mobile browsers tint their own bar from this tag, which CSS variables can't reach.
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", BROWSER_BAR_COLORS[theme]);
}

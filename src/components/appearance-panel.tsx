"use client";

import { Icon } from "@/components/icon";
import { setTheme, useTheme } from "@/components/use-theme";

export function AppearancePanel({ onBack }: { onBack: () => void }) {
  const theme = useTheme();
  const isDark = theme === "dark";

  return (
    <>
      <div className="appearance-header">
        {/* autoFocus: the row that opened this panel unmounts, which would otherwise drop keyboard focus. */}
        <button aria-label="Back" autoFocus className="appearance-back" onClick={onBack} type="button">
          <Icon name="chevron" size={16} />
        </button>
        <strong>Switch appearance</strong>
        <Icon name={isDark ? "moon" : "sun"} size={20} />
      </div>
      <button
        aria-checked={isDark}
        className="appearance-toggle"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        role="switch"
        type="button"
      >
        Dark mode
        <span aria-hidden="true" className="theme-switch" />
      </button>
    </>
  );
}

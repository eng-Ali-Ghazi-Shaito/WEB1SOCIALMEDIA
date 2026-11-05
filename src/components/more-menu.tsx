"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { AppearancePanel } from "@/components/appearance-panel";
import { Icon } from "@/components/icon";

// The popover attribute gives click-outside and Esc dismissal without any state.
export function MoreMenu({ placement }: { placement: "sidebar" | "top-bar" }) {
  const router = useRouter();
  const menuId = useId();
  const [view, setView] = useState<"main" | "appearance">("main");

  return (
    <>
      <button
        aria-label="More"
        className={placement === "sidebar" ? "nav-link" : "icon-button"}
        popoverTarget={menuId}
        type="button"
      >
        <span className="nav-icon">
          <Icon name="menu" />
        </span>
        {placement === "sidebar" && <span className="nav-label">More</span>}
      </button>
      <div
        className={`more-popover more-popover-${placement}`}
        id={menuId}
        onToggle={(event) => {
          if (event.newState === "closed") setView("main");
        }}
        popover="auto"
      >
        {view === "appearance" ? (
          <AppearancePanel onBack={() => setView("main")} />
        ) : (
          <>
            {/* autoFocus only takes effect when returning from the panel: the closed popover can't hold focus. */}
            <button autoFocus className="more-row" onClick={() => setView("appearance")} type="button">
              <Icon name="moon" />
              Switch appearance
            </button>
            {/* TRADE-OFF: demo only navigates; POST /api/auth/logout replaces this once the back end exists. */}
            <button onClick={() => router.push("/login")} type="button">
              Log out
            </button>
          </>
        )}
      </div>
    </>
  );
}

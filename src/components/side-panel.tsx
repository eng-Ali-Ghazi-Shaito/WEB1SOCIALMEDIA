import Link from "next/link";
import type { ReactNode } from "react";
import { FeedScreen } from "@/components/feed-screen";

// Search and notifications keep their own URLs but open as Instagram's slide-out panel:
// on desktop the feed stays visible behind it, on phones the panel is the whole page.
export function SidePanel({
  action,
  children,
  mobileBar,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  mobileBar?: ReactNode;
  title: string;
}) {
  return (
    <>
      <div className="side-panel-behind" inert>
        <FeedScreen />
      </div>
      <Link aria-label={`Close ${title}`} className="side-panel-scrim" href="/feed" />
      <section aria-label={title} className="side-panel">
        {mobileBar}
        <header className="side-panel-header">
          <h1>{title}</h1>
          {action}
        </header>
        {children}
      </section>
    </>
  );
}

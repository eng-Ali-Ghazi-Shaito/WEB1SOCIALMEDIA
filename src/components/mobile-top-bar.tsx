import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/icon";

// Each screen renders its own bar, so the shell never has to branch on the current route.
export function MobileTopBar({
  action,
  backHref,
  title,
}: {
  action?: ReactNode;
  backHref?: string;
  title: string;
}) {
  return (
    <header className="mobile-top-bar">
      <span className="mobile-top-bar-side">
        {backHref && (
          <Link aria-label="Back" className="icon-button" href={backHref}>
            <Icon name="arrow" />
          </Link>
        )}
      </span>
      <h1>{title}</h1>
      <span className="mobile-top-bar-side mobile-top-bar-end">{action}</span>
    </header>
  );
}

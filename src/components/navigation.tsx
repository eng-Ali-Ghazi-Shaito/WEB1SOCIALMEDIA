"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { Avatar } from "@/components/avatar";
import { Icon, type IconName } from "@/components/icon";
import { CURRENT_USER } from "@/data/demo-content";

export const PROFILE_HREF = `/users/${CURRENT_USER.username}`;

export function isActivePath(pathname: string | null, href: string) {
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}

function CurrentPath({ children }: { children: (pathname: string) => ReactNode }) {
  return children(usePathname());
}

// With cacheComponents, usePathname suspends on params unknown at build time, so the
// links render with nothing active until the path resolves instead of blocking the shell.
export function WithPathname({
  children,
}: {
  children: (pathname: string | null) => ReactNode;
}) {
  return (
    <Suspense fallback={children(null)}>
      <CurrentPath>{children}</CurrentPath>
    </Suspense>
  );
}

export function NavItem({
  active,
  badge,
  href,
  icon,
  label,
}: {
  active: boolean;
  badge?: number;
  href: string;
  icon: IconName;
  label: string;
}) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label={label}
      className={`nav-link${active ? " nav-link-active" : ""}`}
      href={href}
    >
      <span className="nav-icon">
        <Icon filled={active} name={icon} />
        {badge ? <span className="nav-badge">{badge}</span> : null}
      </span>
      <span className="nav-label">{label}</span>
    </Link>
  );
}

export function ProfileNavItem({ active }: { active: boolean }) {
  return (
    <Link
      aria-current={active ? "page" : undefined}
      aria-label="Profile"
      className={`nav-link${active ? " nav-link-active" : ""}`}
      href={PROFILE_HREF}
    >
      <span className="nav-icon nav-avatar">
        <Avatar name={CURRENT_USER.fullName} size="tiny" src={CURRENT_USER.avatarUrl} />
      </span>
      <span className="nav-label">Profile</span>
    </Link>
  );
}

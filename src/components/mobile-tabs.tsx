"use client";

import {
  isActivePath,
  NavItem,
  PROFILE_HREF,
  ProfileNavItem,
  WithPathname,
} from "@/components/navigation";

export function MobileTabs({ unreadMessages }: { unreadMessages: number }) {
  return (
    <WithPathname>
      {(pathname) => (
        <nav aria-label="Mobile navigation" className="mobile-tabs">
          <NavItem active={isActivePath(pathname, "/feed")} href="/feed" icon="home" label="Home" />
          <NavItem active={isActivePath(pathname, "/search")} href="/search" icon="search" label="Search" />
          <NavItem active={isActivePath(pathname, "/posts/new")} href="/posts/new" icon="create" label="Create" />
          <NavItem
            active={isActivePath(pathname, "/conversations")}
            badge={unreadMessages}
            href="/conversations"
            icon="send"
            label="Messages"
          />
          <ProfileNavItem active={isActivePath(pathname, PROFILE_HREF)} />
        </nav>
      )}
    </WithPathname>
  );
}

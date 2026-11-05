"use client";

import Link from "next/link";
import { BrandGlyph, BrandWordmark } from "@/components/brand-logo";
import { MoreMenu } from "@/components/more-menu";
import {
  isActivePath,
  NavItem,
  PROFILE_HREF,
  ProfileNavItem,
  WithPathname,
} from "@/components/navigation";

export function Sidebar({
  unreadMessages,
  unreadNotifications,
}: {
  unreadMessages: number;
  unreadNotifications: number;
}) {
  return (
    <aside className="sidebar">
      <Link aria-label="MACGRAM home" className="sidebar-logo" href="/feed">
        <BrandWordmark />
        <BrandGlyph />
      </Link>
      <WithPathname>
        {(pathname) => (
          <nav aria-label="Main navigation" className="sidebar-nav">
            <NavItem active={isActivePath(pathname, "/feed")} href="/feed" icon="home" label="Home" />
            <NavItem active={isActivePath(pathname, "/search")} href="/search" icon="search" label="Search" />
            <NavItem
              active={isActivePath(pathname, "/conversations")}
              badge={unreadMessages}
              href="/conversations"
              icon="send"
              label="Messages"
            />
            <NavItem
              active={isActivePath(pathname, "/notifications")}
              badge={unreadNotifications}
              href="/notifications"
              icon="heart"
              label="Notifications"
            />
            <NavItem active={isActivePath(pathname, "/posts/new")} href="/posts/new" icon="create" label="Create" />
            <ProfileNavItem active={isActivePath(pathname, PROFILE_HREF)} />
          </nav>
        )}
      </WithPathname>
      <div className="sidebar-bottom">
        <MoreMenu placement="sidebar" />
      </div>
    </aside>
  );
}

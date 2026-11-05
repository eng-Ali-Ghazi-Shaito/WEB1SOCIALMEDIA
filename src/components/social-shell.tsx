"use client";

import type { ReactNode } from "react";
import { useDemo } from "@/components/demo-provider";
import { MobileTabs } from "@/components/mobile-tabs";
import { Sidebar } from "@/components/sidebar";

export function SocialShell({ children }: { children: ReactNode }) {
  const { notifications, unreadConversations } = useDemo();
  const unreadNotifications = notifications.filter((item) => !item.read).length;

  return (
    <div className="social-shell">
      <Sidebar
        unreadMessages={unreadConversations.size}
        unreadNotifications={unreadNotifications}
      />
      <main className="main-column">{children}</main>
      <MobileTabs unreadMessages={unreadConversations.size} />
    </div>
  );
}

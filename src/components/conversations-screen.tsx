"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { useDemo } from "@/components/demo-provider";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { isActivePath, WithPathname } from "@/components/navigation";
import { CURRENT_USER, SUGGESTED_USERS } from "@/data/demo-content";

export function ConversationsScreen() {
  const { messages, unreadConversations } = useDemo();
  // A chat started from a profile only exists in `messages`, so the list is built from it.
  const contacts = SUGGESTED_USERS.filter(({ username }) => username in messages);

  return (
    <aside className="inbox-list">
      <MobileTopBar backHref="/feed" title={CURRENT_USER.username} />
      <header className="inbox-list-header">
        <h1>{CURRENT_USER.username}</h1>
        <h2>Messages</h2>
      </header>
      <WithPathname>
        {(pathname) =>
          contacts.map((user) => {
            const href = `/conversations/${user.username}`;
            const last = messages[user.username]?.at(-1);
            const unread = unreadConversations.has(user.username);
            const prefix = last?.senderUsername === CURRENT_USER.username ? "You: " : "";
            return (
              <Link
                className={`inbox-row${isActivePath(pathname, href) ? " inbox-row-active" : ""}`}
                href={href}
                key={user.username}
              >
                <Avatar name={user.fullName} size="large" src={user.avatarUrl} />
                <span className={`inbox-row-copy${unread ? " inbox-row-unread" : ""}`}>
                  <span className="inbox-row-name">{user.fullName}</span>
                  <span className="inbox-row-preview">
                    <span>{last ? `${prefix}${last.body}` : "Say hello"}</span>
                    {last && <small> • {last.timeLabel}</small>}
                  </span>
                </span>
                {unread && <span aria-label="Unread" className="unread-dot" role="img" />}
              </Link>
            );
          })
        }
      </WithPathname>
    </aside>
  );
}

"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { useDemo } from "@/components/demo-provider";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { SidePanel } from "@/components/side-panel";

export function NotificationsScreen() {
  const {
    following,
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    toggleFollow,
  } = useDemo();
  const hasUnread = notifications.some((item) => !item.read);

  return (
    <SidePanel
      action={
        hasUnread && (
          <button className="text-link" onClick={markAllNotificationsRead} type="button">
            Mark all as read
          </button>
        )
      }
      mobileBar={<MobileTopBar backHref="/feed" title="Notifications" />}
      title="Notifications"
    >
      <div className="panel-list">
        {notifications.map((item) => {
          const profileHref = `/users/${item.actor.username}`;
          const isFollowing = following.has(item.actor.username);
          return (
            <article
              className="panel-row"
              key={item.id}
              onClick={() => markNotificationRead(item.id)}
            >
              <Link href={profileHref}>
                <Avatar name={item.actor.fullName} src={item.actor.avatarUrl} />
              </Link>
              <p className="panel-row-text">
                <Link href={profileHref}>{item.actor.username}</Link>{" "}
                {item.kind === "like" ? "liked your photo." : "started following you."}{" "}
                <time>{item.timeLabel}</time>
              </p>
              {!item.read && <span aria-label="Unread" className="unread-dot" role="img" />}
              {item.kind === "like" && item.postImage ? (
                <Link
                  aria-label="View liked photo"
                  className="panel-thumbnail"
                  href="/feed"
                  style={{ backgroundImage: `url("${item.postImage}")` }}
                />
              ) : (
                <button
                  className={`btn ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => toggleFollow(item.actor.username)}
                  type="button"
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </article>
          );
        })}
        {!notifications.length && (
          <div className="empty-state">
            <h2>Activity on your posts</h2>
            <p>When someone likes your photos or follows you, you&apos;ll see it here.</p>
          </div>
        )}
      </div>
    </SidePanel>
  );
}

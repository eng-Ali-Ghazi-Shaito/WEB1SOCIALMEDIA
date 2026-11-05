"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { useDemo } from "@/components/demo-provider";
import { CURRENT_USER, SUGGESTED_USERS } from "@/data/demo-content";
import { SUGGESTION_LIMIT } from "@/lib/ui-constants";

export function RightRail() {
  const { following, toggleFollow } = useDemo();

  return (
    <aside className="right-rail">
      <div className="rail-row rail-account">
        <Link href={`/users/${CURRENT_USER.username}`}>
          <Avatar name={CURRENT_USER.fullName} src={CURRENT_USER.avatarUrl} />
        </Link>
        <span className="rail-copy">
          <Link href={`/users/${CURRENT_USER.username}`}>{CURRENT_USER.username}</Link>
          <small>{CURRENT_USER.fullName}</small>
        </span>
      </div>
      <div className="rail-heading">
        <span>Suggested for you</span>
        <Link href="/search">See all</Link>
      </div>
      {SUGGESTED_USERS.slice(0, SUGGESTION_LIMIT).map((user) => {
        const isFollowing = following.has(user.username);
        return (
          <div className="rail-row" key={user.username}>
            <Link href={`/users/${user.username}`}>
              <Avatar name={user.fullName} size="small" src={user.avatarUrl} />
            </Link>
            <span className="rail-copy">
              <Link href={`/users/${user.username}`}>{user.username}</Link>
              <small>Suggested for you</small>
            </span>
            <button
              className={`text-link${isFollowing ? " text-link-muted" : ""}`}
              onClick={() => toggleFollow(user.username)}
              type="button"
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          </div>
        );
      })}
      <p className="rail-footer">© 2026 MACGRAM</p>
    </aside>
  );
}

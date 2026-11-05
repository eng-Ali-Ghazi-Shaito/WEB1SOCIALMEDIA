"use client";

import Link from "next/link";
import { BrandWordmark } from "@/components/brand-logo";
import { useDemo } from "@/components/demo-provider";
import { Icon } from "@/components/icon";
import { PostCard } from "@/components/post-card";
import { RightRail } from "@/components/right-rail";

export function FeedScreen() {
  const { notifications, posts } = useDemo();
  const hasUnread = notifications.some((item) => !item.read);

  return (
    <>
      <header className="mobile-top-bar mobile-top-bar-home">
        <Link aria-label="MACGRAM home" href="/feed">
          <BrandWordmark />
        </Link>
        <Link aria-label="Notifications" className="icon-button feed-heart" href="/notifications">
          <Icon name="heart" />
          {hasUnread && <span className="feed-heart-dot" />}
        </Link>
      </header>
      <div className="feed-layout">
        <section aria-label="Feed" className="feed-column">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {posts.length ? (
            <div className="feed-end">
              <span className="feed-end-icon">
                <Icon name="check" size={40} />
              </span>
              <h2>You&apos;re all caught up</h2>
              <p>You&apos;ve seen all new posts.</p>
            </div>
          ) : (
            <div className="empty-state">
              <h2>Find people to follow</h2>
              <p>When you follow people, their newest photos will show up here.</p>
              <Link className="btn btn-primary" href="/search">
                Find people
              </Link>
            </div>
          )}
        </section>
        <RightRail />
      </div>
    </>
  );
}

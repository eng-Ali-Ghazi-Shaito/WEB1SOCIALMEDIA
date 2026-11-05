"use client";

import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { useDemo } from "@/components/demo-provider";
import { Icon } from "@/components/icon";
import { MobileTopBar } from "@/components/mobile-top-bar";
import { MoreMenu } from "@/components/more-menu";
import { ProfileGrid } from "@/components/profile-grid";
import { CURRENT_USER, SUGGESTED_USERS } from "@/data/demo-content";

export function ProfileScreen({ username }: { username: string }) {
  const { following, posts, toggleFollow } = useDemo();
  const normalized = username.toLowerCase();
  const user =
    normalized === CURRENT_USER.username
      ? CURRENT_USER
      : SUGGESTED_USERS.find((item) => item.username === normalized);

  if (!user) {
    return (
      <div className="empty-state profile-missing">
        <h1>Sorry, this page isn&apos;t available.</h1>
        <p>The link you followed may be broken, or the page may have been removed.</p>
        <Link className="text-link" href="/feed">
          Go back to MACGRAM
        </Link>
      </div>
    );
  }

  const isSelf = user.username === CURRENT_USER.username;
  const isFollowing = following.has(user.username);
  const userPosts = posts.filter((post) => post.author.username === user.username);
  const followers = user.followers + (isFollowing ? 1 : 0);

  return (
    <>
      <MobileTopBar
        action={isSelf ? <MoreMenu placement="top-bar" /> : undefined}
        backHref={isSelf ? undefined : "/feed"}
        title={user.username}
      />
      <section className="profile-screen">
        <header className="profile-header">
          <span className="profile-avatar">
            <Avatar name={user.fullName} size="huge" src={user.avatarUrl} />
          </span>
          <div className="profile-title-row">
            <h2>{user.username}</h2>
            {!isSelf && (
              <div className="profile-actions">
                <button
                  className={`btn ${isFollowing ? "btn-secondary" : "btn-primary"}`}
                  onClick={() => toggleFollow(user.username)}
                  type="button"
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <Link className="btn btn-secondary" href={`/conversations/${user.username}`}>
                  Message
                </Link>
              </div>
            )}
          </div>
          <ul className="profile-stats">
            <li><strong>{userPosts.length.toLocaleString("en-US")}</strong> {userPosts.length === 1 ? "post" : "posts"}</li>
            <li><strong>{followers.toLocaleString("en-US")}</strong> followers</li>
            <li><strong>{user.following.toLocaleString("en-US")}</strong> following</li>
          </ul>
          <div className="profile-bio">
            <strong>{user.fullName}</strong>
            <p>{user.bio}</p>
          </div>
        </header>
        <div className="profile-tabs">
          <span className="profile-tab">
            <Icon name="grid" size={12} /> POSTS
          </span>
        </div>
        {userPosts.length ? (
          <ProfileGrid posts={userPosts} />
        ) : (
          <div className="empty-state">
            <h2>{isSelf ? "Share photos" : "No posts yet"}</h2>
            {isSelf && (
              <>
                <p>When you share photos, they will appear on your profile.</p>
                <Link className="text-link" href="/posts/new">
                  Share your first photo
                </Link>
              </>
            )}
          </div>
        )}
      </section>
    </>
  );
}

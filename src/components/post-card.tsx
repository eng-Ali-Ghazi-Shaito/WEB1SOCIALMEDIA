"use client";

import Link from "next/link";
import { useRef, useState, type MouseEvent } from "react";
import { Avatar } from "@/components/avatar";
import { useDemo } from "@/components/demo-provider";
import { Icon } from "@/components/icon";
import { PostCaption } from "@/components/post-caption";
import { PostOptions } from "@/components/post-options";
import { CURRENT_USER, type DemoPost } from "@/data/demo-content";
import { DOUBLE_TAP_MS } from "@/lib/ui-constants";

function likesLabel(likes: number) {
  if (likes === 0) return "Be the first to like this";
  return `${likes.toLocaleString("en-US")} ${likes === 1 ? "like" : "likes"}`;
}

export function PostCard({ post }: { post: DemoPost }) {
  const { toggleLike } = useDemo();
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [burst, setBurst] = useState(0);
  const lastTap = useRef(0);
  const isOwner = post.author.username === CURRENT_USER.username;
  const profileHref = `/users/${post.author.username}`;

  // Timed clicks instead of onDoubleClick: dblclick is unreliable on touch screens.
  function handleImageTap(event: MouseEvent) {
    if (event.timeStamp - lastTap.current < DOUBLE_TAP_MS) {
      // Double tap only ever likes; unliking stays on the heart button.
      if (!post.liked) toggleLike(post.id);
      setBurst((count) => count + 1);
    }
    lastTap.current = event.timeStamp;
  }

  return (
    <article className="post-card">
      <header className="post-header">
        <Link href={profileHref}>
          <Avatar name={post.author.fullName} size="small" src={post.author.avatarUrl} />
        </Link>
        <span className="post-author">
          <Link href={profileHref}>{post.author.username}</Link>
          <span className="post-time"> • {post.timeLabel}</span>
        </span>
        <button
          aria-label="Post options"
          className="icon-button post-options-button"
          onClick={() => setOptionsOpen(true)}
          type="button"
        >
          <Icon name="more" />
        </button>
      </header>
      <div
        aria-label={`Photo shared by ${post.author.fullName}`}
        className="post-image"
        onClick={handleImageTap}
        role="img"
        style={{ backgroundImage: `url("${post.imageUrl}")` }}
      >
        {burst > 0 && (
          <span className="like-burst" key={burst}>
            <Icon filled name="heart" size={96} />
          </span>
        )}
      </div>
      <div className="post-actions">
        <button
          aria-label={post.liked ? "Unlike" : "Like"}
          aria-pressed={post.liked}
          className={`icon-button like-button${post.liked ? " is-liked" : ""}`}
          onClick={() => toggleLike(post.id)}
          type="button"
        >
          <Icon filled={post.liked} name="heart" />
        </button>
        {!isOwner && (
          <Link
            aria-label={`Message ${post.author.username}`}
            className="icon-button"
            href={`/conversations/${post.author.username}`}
          >
            <Icon name="send" />
          </Link>
        )}
      </div>
      <p className="post-likes">{likesLabel(post.likes)}</p>
      <PostCaption caption={post.caption} profileHref={profileHref} username={post.author.username} />
      {optionsOpen && (
        <PostOptions onClose={() => setOptionsOpen(false)} post={post} profileHref={profileHref} />
      )}
    </article>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "@/components/icon";
import { Modal } from "@/components/modal";
import { PostCard } from "@/components/post-card";
import type { DemoPost } from "@/data/demo-content";

export function ProfileGrid({ posts }: { posts: DemoPost[] }) {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  // Looked up by id, not stored as an object, so likes stay live and a delete closes the dialog.
  const openPost = posts.find((post) => post.id === openPostId);

  return (
    <>
      <div className="profile-grid">
        {posts.map((post) => (
          <button
            aria-label={`Open post, ${post.likes} likes`}
            className="profile-tile"
            key={post.id}
            onClick={() => setOpenPostId(post.id)}
            style={{ backgroundImage: `url("${post.imageUrl}")` }}
            type="button"
          >
            <span className="profile-tile-overlay">
              <Icon filled name="heart" size={19} /> {post.likes.toLocaleString("en-US")}
            </span>
          </button>
        ))}
      </div>
      {openPost && (
        <Modal className="post-modal" label="Post" onClose={() => setOpenPostId(null)}>
          <button
            aria-label="Close"
            className="icon-button post-modal-close"
            onClick={() => setOpenPostId(null)}
            type="button"
          >
            <Icon name="close" />
          </button>
          <div className="post-modal-body">
            <PostCard post={openPost} />
          </div>
        </Modal>
      )}
    </>
  );
}

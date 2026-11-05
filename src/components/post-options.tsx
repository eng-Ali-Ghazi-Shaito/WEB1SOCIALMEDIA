"use client";

import Link from "next/link";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { Modal } from "@/components/modal";
import { CURRENT_USER, type DemoPost } from "@/data/demo-content";

export function PostOptions({
  onClose,
  post,
  profileHref,
}: {
  onClose: () => void;
  post: DemoPost;
  profileHref: string;
}) {
  const { deletePost } = useDemo();
  const [confirming, setConfirming] = useState(false);
  const isOwner = post.author.username === CURRENT_USER.username;

  return (
    <Modal label="Post options" onClose={onClose}>
      <div className="modal-sheet">
        {confirming ? (
          <>
            <header>
              <h2>Delete post?</h2>
              <p>Are you sure you want to delete this post?</p>
            </header>
            <button
              className="modal-row modal-row-danger"
              onClick={() => deletePost(post.id)}
              type="button"
            >
              Delete
            </button>
          </>
        ) : isOwner ? (
          <button
            className="modal-row modal-row-danger"
            onClick={() => setConfirming(true)}
            type="button"
          >
            Delete
          </button>
        ) : (
          <Link className="modal-row" href={profileHref}>
            Go to profile
          </Link>
        )}
        <button className="modal-row" onClick={onClose} type="button">
          Cancel
        </button>
      </div>
    </Modal>
  );
}

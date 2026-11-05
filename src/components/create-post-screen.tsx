"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type DragEvent, type FormEvent } from "react";
import { Avatar } from "@/components/avatar";
import { useDemo } from "@/components/demo-provider";
import { FeedScreen } from "@/components/feed-screen";
import { Icon } from "@/components/icon";
import { CURRENT_USER } from "@/data/demo-content";
import {
  characterCount,
  isAcceptedImage,
  MAX_CAPTION_LENGTH,
} from "@/lib/demo-validation";

export function CreatePostScreen() {
  const router = useRouter();
  const { createPost } = useDemo();
  const [imageData, setImageData] = useState("");
  const [caption, setCaption] = useState("");
  const [error, setError] = useState("");

  function loadImage(file: File | undefined) {
    setError("");
    if (!file) return;
    if (!isAcceptedImage(file)) {
      setError(
        file.type.startsWith("image/") && file.size > 0
          ? "Use a JPEG, PNG or WebP image of 5 MB or less."
          : "This file isn't supported. Choose a JPEG, PNG or WebP image.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setImageData(reader.result);
      else setError("That image couldn't be previewed. Try another file.");
    };
    reader.onerror = () => setError("That image couldn't be read. Try another file.");
    reader.readAsDataURL(file);
  }

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    loadImage(event.dataTransfer.files[0]);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (characterCount(caption) > MAX_CAPTION_LENGTH) {
      setError("Captions can be up to 2,200 characters.");
      return;
    }
    createPost(imageData, caption.trim());
    router.push("/feed");
  }

  return (
    <>
      <div className="create-behind" inert>
        <FeedScreen />
      </div>
      <div aria-label="Create new post" aria-modal="true" className="create-overlay" role="dialog">
        <Link aria-label="Close" className="icon-button create-close" href="/feed">
          <Icon name="close" />
        </Link>
        <form className={`create-card${imageData ? " create-card-wide" : ""}`} onSubmit={submit}>
          <header className="create-header">
            {imageData ? (
              <button aria-label="Back" className="icon-button" onClick={() => setImageData("")} type="button">
                <Icon name="arrow" />
              </button>
            ) : (
              <Link aria-label="Close" className="icon-button create-header-close" href="/feed">
                <Icon name="close" />
              </Link>
            )}
            <h1>Create new post</h1>
            {imageData && <button className="create-share" type="submit">Share</button>}
          </header>
          {imageData ? (
            <div className="create-compose">
              <div
                aria-label="Selected photo preview"
                className="create-preview"
                role="img"
                style={{ backgroundImage: `url("${imageData}")` }}
              />
              <div className="create-details">
                <div className="create-author">
                  <Avatar name={CURRENT_USER.fullName} size="tiny" src={CURRENT_USER.avatarUrl} />
                  <strong>{CURRENT_USER.username}</strong>
                </div>
                <textarea
                  aria-label="Write a caption"
                  onChange={(event) => setCaption(event.target.value)}
                  placeholder="Write a caption..."
                  value={caption}
                />
                <small className="create-count">
                  {characterCount(caption).toLocaleString("en-US")}/
                  {MAX_CAPTION_LENGTH.toLocaleString("en-US")}
                </small>
                {error && <p className="form-message form-error">{error}</p>}
              </div>
            </div>
          ) : (
            <div className="create-drop" onDragOver={(event) => event.preventDefault()} onDrop={handleDrop}>
              <Icon name="image" size={72} />
              <p>Drag photos here</p>
              {error && <p className="form-message form-error">{error}</p>}
              <label className="btn btn-primary">
                Select from computer
                <input
                  accept="image/jpeg,image/png,image/webp"
                  aria-label="Choose a photo"
                  className="visually-hidden"
                  onChange={(event) => loadImage(event.currentTarget.files?.[0])}
                  type="file"
                />
              </label>
            </div>
          )}
        </form>
      </div>
    </>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { CAPTION_PREVIEW_LENGTH } from "@/lib/ui-constants";

export function PostCaption({
  caption,
  profileHref,
  username,
}: {
  caption: string;
  profileHref: string;
  username: string;
}) {
  const [expanded, setExpanded] = useState(false);
  if (!caption) return null;

  // Spread by code point so a cut can never split an emoji in half.
  const characters = [...caption];
  const collapsed = !expanded && characters.length > CAPTION_PREVIEW_LENGTH;

  return (
    <p className="post-caption">
      <Link href={profileHref}>{username}</Link>{" "}
      {collapsed ? `${characters.slice(0, CAPTION_PREVIEW_LENGTH).join("")}… ` : caption}
      {collapsed && (
        <button className="post-caption-more" onClick={() => setExpanded(true)} type="button">
          more
        </button>
      )}
    </p>
  );
}

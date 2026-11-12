import type { z } from "zod";

import type { feedQuerySchema } from "@/validations/feed.schema";

export type FeedQuery = z.infer<typeof feedQuerySchema>;
export type FeedCursor = NonNullable<FeedQuery["cursor"]>;

export interface FeedPost {
  id: string;
  imageUrl: string;
  caption: string | null;
  createdAt: string;
  author: {
    id: string;
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
  likeCount: number;
  likedByMe: boolean;
}

export interface FeedPage {
  posts: FeedPost[];
  nextCursor: string | null;
}

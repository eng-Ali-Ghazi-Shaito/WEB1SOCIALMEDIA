import type { z } from "zod";

import type { setPostLikeSchema } from "@/validations/post.schema";

export type SetPostLikeDto = z.infer<typeof setPostLikeSchema>;

export interface PostLikeState {
  liked: boolean;
  likeCount: number;
}

export interface PostRouteContext {
  params: Promise<{ id: string }>;
}

export interface PostDeletionTarget {
  id: string;
  authorId: string;
}

export interface DeletedPostImage {
  imageKey: string;
}

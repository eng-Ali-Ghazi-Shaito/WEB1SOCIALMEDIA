// The body of API #7. The email is returned here and nowhere else (NFR-05).
export interface MyAccount {
  id: string;
  email: string;
  username: string;
  fullName: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  unreadNotifications: number;
  unreadConversations: number;
}

import type { z } from "zod";

import type { userSearchQuerySchema } from "@/validations/user.schema";

// El input ba3d ma Zod yfa7so w ynaddfo.
export type UserSearchQuery = z.infer<typeof userSearchQuerySchema>;

// User wa7ad bel lista. Ma fi email hon (NFR-05: el email bas bi #7).
export interface UserSearchResult {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
}
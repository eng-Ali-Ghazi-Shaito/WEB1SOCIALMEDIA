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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CURRENT_USER,
  INITIAL_MESSAGES,
  INITIAL_NOTIFICATIONS,
  INITIAL_POSTS,
  type DemoMessage,
  type DemoNotification,
  type DemoPost,
} from "@/data/demo-content";

interface DemoContextValue {
  posts: DemoPost[];
  following: Set<string>;
  messages: Record<string, DemoMessage[]>;
  unreadConversations: Set<string>;
  notifications: DemoNotification[];
  toggleLike: (postId: string) => void;
  toggleFollow: (username: string) => void;
  createPost: (imageUrl: string, caption: string) => void;
  deletePost: (postId: string) => void;
  sendMessage: (conversationId: string, body: string) => void;
  markConversationRead: (conversationId: string) => void;
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [following, setFollowing] = useState(
    () => new Set(["sara.kim", "marco.lee"]),
  );
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [unreadConversations, setUnreadConversations] = useState(
    () => new Set(["alex.woods"]),
  );
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const toggleLike = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? {
              ...post,
              liked: !post.liked,
              likes: post.likes + (post.liked ? -1 : 1),
            }
          : post,
      ),
    );
  }, []);

  const toggleFollow = useCallback((username: string) => {
    setFollowing((current) => {
      const next = new Set(current);
      if (next.has(username)) next.delete(username);
      else next.add(username);
      return next;
    });
  }, []);

  const createPost = useCallback((imageUrl: string, caption: string) => {
    const newPost: DemoPost = {
      id: `post-${Date.now()}`,
      author: CURRENT_USER,
      imageUrl,
      caption,
      likes: 0,
      liked: false,
      timeLabel: "now",
    };
    setPosts((current) => [newPost, ...current]);
  }, []);

  const deletePost = useCallback((postId: string) => {
    setPosts((current) =>
      current.filter(
        (post) =>
          post.id !== postId || post.author.username !== CURRENT_USER.username,
      ),
    );
  }, []);

  const sendMessage = useCallback((conversationId: string, body: string) => {
    const message: DemoMessage = {
      id: `message-${Date.now()}`,
      senderUsername: CURRENT_USER.username,
      body,
      timeLabel: new Intl.DateTimeFormat("en", {
        hour: "numeric",
        minute: "2-digit",
      }).format(new Date()),
      seen: false,
    };
    setMessages((current) => ({
      ...current,
      [conversationId]: [...(current[conversationId] ?? []), message],
    }));
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    setUnreadConversations((current) => {
      if (!current.has(conversationId)) return current;
      const next = new Set(current);
      next.delete(conversationId);
      return next;
    });
  }, []);

  const markNotificationRead = useCallback((notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification,
      ),
    );
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true })),
    );
  }, []);

  const value = useMemo(
    () => ({
      posts,
      following,
      messages,
      unreadConversations,
      notifications,
      toggleLike,
      toggleFollow,
      createPost,
      deletePost,
      sendMessage,
      markConversationRead,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      posts,
      following,
      messages,
      unreadConversations,
      notifications,
      toggleLike,
      toggleFollow,
      createPost,
      deletePost,
      sendMessage,
      markConversationRead,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error("useDemo must be used within DemoProvider.");
  return context;
}

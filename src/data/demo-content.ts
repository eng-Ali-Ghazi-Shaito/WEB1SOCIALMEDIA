export interface DemoUser {
  username: string;
  fullName: string;
  avatarUrl: string;
  bio: string;
  followers: number;
  following: number;
}

export interface DemoPost {
  id: string;
  author: DemoUser;
  imageUrl: string;
  caption: string;
  likes: number;
  liked: boolean;
  timeLabel: string;
}

export interface DemoMessage {
  id: string;
  senderUsername: string;
  body: string;
  timeLabel: string;
  seen: boolean;
}

export interface DemoNotification {
  id: string;
  actor: DemoUser;
  kind: "follow" | "like";
  postImage?: string;
  timeLabel: string;
  read: boolean;
}

const image = (id: string, width = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=85`;

export const CURRENT_USER: DemoUser = {
  username: "maya.chen",
  fullName: "Maya Chen",
  avatarUrl: image("photo-1534528741775-53994a69daeb", 160),
  bio: "Collecting small moments, one frame at a time.",
  followers: 1284,
  following: 302,
};

export const SUGGESTED_USERS: DemoUser[] = [
  {
    username: "alex.woods",
    fullName: "Alex Woods",
    avatarUrl: image("photo-1500648767791-00dcc994a43e", 160),
    bio: "Outdoors, always.",
    followers: 2420,
    following: 418,
  },
  {
    username: "lena.parker",
    fullName: "Lena Parker",
    avatarUrl: image("photo-1524504388940-b1c1722653e1", 160),
    bio: "Designing a slower life.",
    followers: 918,
    following: 260,
  },
  {
    username: "noah.ellis",
    fullName: "Noah Ellis",
    avatarUrl: image("photo-1506794778202-cad84cf45f1d", 160),
    bio: "A little light, a lot of coffee.",
    followers: 3710,
    following: 611,
  },
  {
    username: "sara.kim",
    fullName: "Sara Kim",
    avatarUrl: image("photo-1531123897727-8f129e1688ce", 160),
    bio: "Finding color in the everyday.",
    followers: 1640,
    following: 504,
  },
  {
    username: "marco.lee",
    fullName: "Marco Lee",
    avatarUrl: image("photo-1501196354995-cbb51c65aaea", 160),
    bio: "Weekend wanderer.",
    followers: 2078,
    following: 388,
  },
];

export const INITIAL_POSTS: DemoPost[] = [
  {
    id: "post-1",
    author: SUGGESTED_USERS[3],
    imageUrl: image("photo-1470770841072-f978cf4d019e"),
    caption: "A quiet morning by the water. I could stay here all day.",
    likes: 184,
    liked: false,
    timeLabel: "18m",
  },
  {
    id: "post-2",
    author: SUGGESTED_USERS[0],
    imageUrl: image("photo-1472396961693-142e6e269027"),
    caption: "Took the long way home. Always take the long way home.",
    likes: 92,
    liked: true,
    timeLabel: "1h",
  },
  {
    id: "post-3",
    author: CURRENT_USER,
    imageUrl: image("photo-1518837695005-2083093ee35b"),
    caption: "Salt in the air, nowhere else to be.",
    likes: 267,
    liked: false,
    timeLabel: "3h",
  },
  {
    id: "post-4",
    author: SUGGESTED_USERS[1],
    imageUrl: image("photo-1449247709967-d4461a6a6103"),
    caption: "The little corner that makes this place feel like home.",
    likes: 73,
    liked: false,
    timeLabel: "5h",
  },
  {
    id: "post-5",
    author: SUGGESTED_USERS[4],
    imageUrl: image("photo-1500530855697-b586d89ba3ee"),
    caption: "The best plans are the ones that leave room for detours.",
    likes: 311,
    liked: false,
    timeLabel: "1d",
  },
];

export const INITIAL_MESSAGES: Record<string, DemoMessage[]> = {
  "alex.woods": [
    {
      id: "message-1",
      senderUsername: "alex.woods",
      body: "Hey Maya! That little coast you posted looks amazing.",
      timeLabel: "10:42 AM",
      seen: true,
    },
    {
      id: "message-2",
      senderUsername: CURRENT_USER.username,
      body: "It was such a good reset. You should go sometime!",
      timeLabel: "10:44 AM",
      seen: true,
    },
    {
      id: "message-3",
      senderUsername: "alex.woods",
      body: "Adding it to my list for this weekend 🌿",
      timeLabel: "10:46 AM",
      seen: true,
    },
  ],
  "lena.parker": [
    {
      id: "message-4",
      senderUsername: "lena.parker",
      body: "I loved the light in your last photo.",
      timeLabel: "Yesterday",
      seen: true,
    },
  ],
  "noah.ellis": [],
};

export const INITIAL_NOTIFICATIONS: DemoNotification[] = [
  {
    id: "notification-1",
    actor: SUGGESTED_USERS[0],
    kind: "like",
    postImage: INITIAL_POSTS[2].imageUrl,
    timeLabel: "4m",
    read: false,
  },
  {
    id: "notification-2",
    actor: SUGGESTED_USERS[1],
    kind: "follow",
    timeLabel: "22m",
    read: false,
  },
  {
    id: "notification-3",
    actor: SUGGESTED_USERS[4],
    kind: "like",
    postImage: INITIAL_POSTS[2].imageUrl,
    timeLabel: "2h",
    read: true,
  },
];

"use client";

import { useParams } from "next/navigation";
import { ProfileScreen } from "@/components/profile-screen";

export function ProfileRoute() {
  const { username } = useParams<{ username: string }>();
  return <ProfileScreen username={username} />;
}

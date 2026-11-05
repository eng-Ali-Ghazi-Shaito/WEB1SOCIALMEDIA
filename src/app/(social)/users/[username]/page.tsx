import { Suspense } from "react";
import { ProfileRoute } from "@/components/profile-route";
import { RouteFallback } from "@/components/route-fallback";
import { CURRENT_USER, SUGGESTED_USERS } from "@/data/demo-content";

export function generateStaticParams() {
  return [CURRENT_USER, ...SUGGESTED_USERS].map(({ username }) => ({
    username,
  }));
}

export default function UserProfilePage() {
  return (
    <Suspense fallback={<RouteFallback label="profile" />}>
      <ProfileRoute />
    </Suspense>
  );
}

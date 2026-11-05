import { Suspense } from "react";
import { ConversationRoute } from "@/components/conversation-route";
import { RouteFallback } from "@/components/route-fallback";
import { SUGGESTED_USERS } from "@/data/demo-content";

export function generateStaticParams() {
  return SUGGESTED_USERS.map(({ username }) => ({ id: username }));
}

export default function ConversationPage() {
  return (
    <Suspense fallback={<RouteFallback label="conversation" />}>
      <ConversationRoute />
    </Suspense>
  );
}

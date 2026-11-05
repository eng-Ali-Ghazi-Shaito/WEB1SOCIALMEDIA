import type { ReactNode } from "react";
import { ConversationsScreen } from "@/components/conversations-screen";

// A nested layout stays mounted across child routes, so the chat list keeps its scroll
// position while only the right-hand pane changes.
export default function ConversationsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="inbox">
      <ConversationsScreen />
      <section className="inbox-pane">{children}</section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/avatar";
import { ChatComposer } from "@/components/chat-composer";
import { ChatMessages } from "@/components/chat-messages";
import { useDemo } from "@/components/demo-provider";
import { Icon } from "@/components/icon";
import { SUGGESTED_USERS } from "@/data/demo-content";
import { TYPING_DEMO_MS } from "@/lib/ui-constants";

export function ChatScreen({ conversationId }: { conversationId: string }) {
  const contact = SUGGESTED_USERS.find((user) => user.username === conversationId);
  const { markConversationRead, messages, sendMessage } = useDemo();
  const [typing, setTyping] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const thread = messages[conversationId] ?? [];

  useEffect(() => {
    markConversationRead(conversationId);
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    if (scroller.current) scroller.current.scrollTop = scroller.current.scrollHeight;
  }, [thread.length, typing]);

  // TRADE-OFF: with no socket yet, a short "typing" after each send stands in for the
  // real `typing` event so the indicator can still be demonstrated.
  useEffect(() => {
    if (!typing) return;
    const timer = setTimeout(() => setTyping(false), TYPING_DEMO_MS);
    return () => clearTimeout(timer);
  }, [typing]);

  if (!contact) {
    return (
      <div className="chat-thread">
        <div className="empty-state">
          <h2>Conversation not found</h2>
          <Link className="text-link" href="/conversations">
            Back to messages
          </Link>
        </div>
      </div>
    );
  }

  const profileHref = `/users/${contact.username}`;

  return (
    <section className="chat-thread">
      <header className="chat-header">
        <Link aria-label="Back to messages" className="icon-button chat-back" href="/conversations">
          <Icon name="arrow" />
        </Link>
        <Link className="chat-contact" href={profileHref}>
          <Avatar name={contact.fullName} src={contact.avatarUrl} />
          <span>
            <strong>{contact.fullName}</strong>
            <small>{contact.username}</small>
          </span>
        </Link>
      </header>
      <div aria-live="polite" className="chat-scroll" ref={scroller}>
        <div className="chat-intro">
          <Avatar name={contact.fullName} size="huge" src={contact.avatarUrl} />
          <strong>{contact.fullName}</strong>
          <span>{contact.username} · MACGRAM</span>
          <Link className="btn btn-secondary" href={profileHref}>
            View profile
          </Link>
        </div>
        <ChatMessages contact={contact} thread={thread} typing={typing} />
      </div>
      <ChatComposer
        onSend={(body) => {
          sendMessage(conversationId, body);
          setTyping(true);
        }}
      />
    </section>
  );
}

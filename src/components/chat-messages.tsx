import { Avatar } from "@/components/avatar";
import { CURRENT_USER, type DemoMessage, type DemoUser } from "@/data/demo-content";

export function ChatMessages({
  contact,
  thread,
  typing,
}: {
  contact: DemoUser;
  thread: DemoMessage[];
  typing: boolean;
}) {
  const lastMessage = thread.at(-1);
  // PRD: "Seen" sits under the last message only, and only when that message is ours.
  const showSeen = lastMessage?.senderUsername === CURRENT_USER.username && !typing;

  return (
    <div className="chat-messages">
      {thread.map((message, index) => {
        const own = message.senderUsername === CURRENT_USER.username;
        const endOfRun = thread[index + 1]?.senderUsername !== message.senderUsername;
        return (
          <div key={message.id}>
            {index === 0 && <time className="chat-time">{message.timeLabel}</time>}
            <div className={`message ${own ? "message-own" : "message-theirs"}${endOfRun ? " message-run-end" : ""}`}>
              {!own && endOfRun && (
                <Avatar name={contact.fullName} size="tiny" src={contact.avatarUrl} />
              )}
              <p title={message.timeLabel}>{message.body}</p>
            </div>
          </div>
        );
      })}
      {showSeen && <span className="chat-seen">Seen</span>}
      {typing && (
        <div className="message message-theirs message-run-end">
          <Avatar name={contact.fullName} size="tiny" src={contact.avatarUrl} />
          <p aria-label={`${contact.fullName} is typing`} className="typing-dots">
            <span />
            <span />
            <span />
          </p>
        </div>
      )}
    </div>
  );
}

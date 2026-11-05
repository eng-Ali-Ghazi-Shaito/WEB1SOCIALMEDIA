import { Icon } from "@/components/icon";

export function InboxPlaceholder() {
  return (
    <div className="empty-state inbox-placeholder">
      <span className="empty-state-icon">
        <Icon name="send" size={48} />
      </span>
      <h2>Your messages</h2>
      <p>Send a message to start a chat.</p>
    </div>
  );
}

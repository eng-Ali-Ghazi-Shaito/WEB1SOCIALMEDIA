"use client";

import { useState, type FormEvent } from "react";
import { characterCount, MAX_MESSAGE_LENGTH } from "@/lib/demo-validation";

export function ChatComposer({ onSend }: { onSend: (body: string) => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (characterCount(body) > MAX_MESSAGE_LENGTH) {
      setError("Messages can be up to 1,000 characters.");
      return;
    }
    onSend(body);
    setDraft("");
    setError("");
  }

  return (
    <div className="chat-footer">
      {error && <p className="form-message form-error">{error}</p>}
      <form className="chat-composer" onSubmit={submit}>
        <input
          aria-label="Message"
          onChange={(event) => {
            setDraft(event.target.value);
            setError("");
          }}
          placeholder="Message..."
          value={draft}
        />
        {draft.trim() && (
          <button className="chat-send" type="submit">
            Send
          </button>
        )}
      </form>
    </div>
  );
}

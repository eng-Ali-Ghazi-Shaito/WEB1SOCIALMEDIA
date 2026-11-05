"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthField } from "@/components/auth-field";
import { BrandWordmark } from "@/components/brand-logo";
import { Icon } from "@/components/icon";
import { AUTH_SCREENS, type ScreenName } from "@/data/auth-screens";
import { isValidDemoUsername, isValidPasswordLength } from "@/lib/demo-validation";

const NEXT_ROUTE: Partial<Record<ScreenName, string>> = {
  login: "/feed",
  signup: "/verify-email",
  verify: "/feed",
  reset: "/login",
};

export function AuthScreen({ screen }: { screen: ScreenName }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const content = AUTH_SCREENS[screen];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username") ?? "").toLowerCase();
    const password = String(form.get(screen === "reset" ? "newPassword" : "password") ?? "");

    if (screen === "signup" && !isValidDemoUsername(username)) {
      setError("Use 1–30 lowercase letters, numbers, underscores or periods. A period can't start or end the username or repeat.");
      return;
    }
    if ((screen === "signup" || screen === "reset") && !isValidPasswordLength(password)) {
      setError("Your password must be between 8 and 128 characters.");
      return;
    }
    if (screen === "forgot") {
      setSuccess("If an account exists for that email, a reset code is on its way.");
      return;
    }
    router.push(NEXT_ROUTE[screen] ?? "/login");
  }

  return (
    <>
      <section className="auth-box">
        {content.icon ? (
          <span className="auth-icon">
            <Icon name={content.icon} size={48} />
          </span>
        ) : (
          <h1 className="auth-logo">
            <BrandWordmark />
          </h1>
        )}
        {content.title && <h1 className="auth-title">{content.title}</h1>}
        {content.description && <p className="auth-description">{content.description}</p>}
        <form
          className="auth-form"
          onInput={(event) => {
            const form = new FormData(event.currentTarget);
            setReady(content.fields.every(({ name }) => Boolean(form.get(name))));
          }}
          onSubmit={submit}
        >
          {content.fields.map((field) => (
            <AuthField field={field} key={field.name} />
          ))}
          <button className="btn btn-primary btn-block auth-submit" disabled={!ready} type="submit">
            {content.button}
          </button>
          {error && <p className="form-message form-error">{error}</p>}
          {success && <p className="form-message form-success">{success}</p>}
        </form>
        {content.helpLink && (
          <Link className="auth-help" href={content.helpLink.href}>
            {content.helpLink.text}
          </Link>
        )}
      </section>
      <section className="auth-box auth-switch">
        {content.switchPrompt} <Link href={content.switchLink.href}>{content.switchLink.text}</Link>
      </section>
    </>
  );
}

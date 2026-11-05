import type { InputHTMLAttributes } from "react";

export type ScreenName = "login" | "signup" | "verify" | "forgot" | "reset";

export interface AuthFieldConfig {
  name: string;
  label: string;
  type: InputHTMLAttributes<HTMLInputElement>["type"];
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"];
  pattern?: string;
}

interface AuthScreenConfig {
  icon?: "lock" | "mail";
  title?: string;
  description?: string;
  button: string;
  fields: AuthFieldConfig[];
  helpLink?: { text: string; href: string };
  switchPrompt: string;
  switchLink: { text: string; href: string };
}

const emailField: AuthFieldConfig = {
  name: "email",
  label: "Email",
  type: "email",
  autoComplete: "email",
  maxLength: 254,
};

const codeField = (label: string): AuthFieldConfig => ({
  name: "code",
  label,
  type: "text",
  inputMode: "numeric",
  pattern: "[0-9]{6}",
  maxLength: 6,
  autoComplete: "one-time-code",
});

const backToLogin = { text: "Back to login", href: "/login" };

export const AUTH_SCREENS: Record<ScreenName, AuthScreenConfig> = {
  login: {
    button: "Log in",
    fields: [
      { name: "identifier", label: "Username or email", type: "text", autoComplete: "username" },
      { name: "password", label: "Password", type: "password", autoComplete: "current-password" },
    ],
    helpLink: { text: "Forgot password?", href: "/forgot-password" },
    switchPrompt: "Don't have an account?",
    switchLink: { text: "Sign up", href: "/signup" },
  },
  signup: {
    description: "Sign up to see photos from your friends.",
    button: "Sign up",
    fields: [
      emailField,
      { name: "fullName", label: "Full name", type: "text", autoComplete: "name", maxLength: 30 },
      { name: "username", label: "Username", type: "text", autoComplete: "username", maxLength: 30 },
      {
        name: "password",
        label: "Password",
        type: "password",
        autoComplete: "new-password",
        minLength: 8,
        maxLength: 128,
      },
    ],
    switchPrompt: "Have an account?",
    switchLink: { text: "Log in", href: "/login" },
  },
  verify: {
    icon: "mail",
    title: "Enter confirmation code",
    description: "Enter the 6-digit code we sent to your email address.",
    button: "Next",
    fields: [emailField, codeField("Confirmation code")],
    switchPrompt: "Already confirmed?",
    switchLink: { text: "Log in", href: "/login" },
  },
  forgot: {
    icon: "lock",
    title: "Trouble logging in?",
    description: "Enter your email and we'll send you a code to get back into your account.",
    button: "Send reset code",
    fields: [emailField],
    switchPrompt: "Remembered it?",
    switchLink: backToLogin,
  },
  reset: {
    icon: "lock",
    title: "Create a strong password",
    description: "Enter the code from your email and choose a new password.",
    button: "Reset password",
    fields: [
      emailField,
      codeField("Reset code"),
      {
        name: "newPassword",
        label: "New password",
        type: "password",
        autoComplete: "new-password",
        minLength: 8,
        maxLength: 128,
      },
    ],
    switchPrompt: "Remembered it?",
    switchLink: backToLogin,
  },
};

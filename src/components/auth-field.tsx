"use client";

import { useState } from "react";
import type { AuthFieldConfig } from "@/data/auth-screens";

export function AuthField({ field }: { field: AuthFieldConfig }) {
  const { label, type, ...inputProps } = field;
  const [hasValue, setHasValue] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="auth-field">
      {/* The single-space placeholder lets CSS float the label via :placeholder-shown. */}
      <input
        {...inputProps}
        onChange={(event) => {
          if (field.name === "username") {
            event.currentTarget.value = event.currentTarget.value.toLowerCase();
          }
          setHasValue(event.currentTarget.value.length > 0);
        }}
        placeholder=" "
        required
        type={isPassword && revealed ? "text" : type}
      />
      <span>{label}</span>
      {isPassword && hasValue && (
        <button onClick={() => setRevealed((value) => !value)} type="button">
          {revealed ? "Hide" : "Show"}
        </button>
      )}
    </label>
  );
}

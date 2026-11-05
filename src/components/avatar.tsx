import type { CSSProperties } from "react";

export function Avatar({
  src,
  name,
  size = "medium",
}: {
  src: string;
  name: string;
  size?: "tiny" | "small" | "medium" | "large" | "huge";
}) {
  const style = {
    backgroundImage: `url("${src}")`,
  } satisfies CSSProperties;

  return (
    <span
      className={`avatar avatar-${size}`}
      role="img"
      aria-label={`${name}'s profile photo`}
      style={style}
    />
  );
}

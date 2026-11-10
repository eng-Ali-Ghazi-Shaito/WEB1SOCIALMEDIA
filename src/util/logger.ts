type LogLevel = "INFO" | "WARN" | "ERROR";

// Follows the cause chain: wrapped exceptions keep the real failure there.
function describe(value: unknown): string {
  if (!(value instanceof Error)) return String(value);
  const details = value.stack ?? `${value.name}: ${value.message}`;
  return value.cause === undefined
    ? details
    : `${details}\nCaused by: ${describe(value.cause)}`;
}

function format(level: LogLevel, message: string, detail?: unknown): string {
  const line = `${new Date().toISOString()} [${level}] ${message}`;
  return detail === undefined ? line : `${line}\n${describe(detail)}`;
}

// Callers pass only safe text: never tokens, passwords or secrets.
export const logger = {
  info: (message: string) => console.info(format("INFO", message)),
  warn: (message: string) => console.warn(format("WARN", message)),
  error: (message: string, error?: unknown) =>
    console.error(format("ERROR", message, error)),
};

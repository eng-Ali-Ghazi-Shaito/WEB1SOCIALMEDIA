import { publishMonitoringEvent, type LogAction } from "../monitoring/events";

type LogLevel = "INFO" | "WARN" | "ERROR";
const consoleMethods = { INFO: "info", WARN: "warn", ERROR: "error" } as const;

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

function write(level: LogLevel, message: string, action: LogAction, detail?: unknown) {
  const method = consoleMethods[level];
  console[method](format(level, message, detail));
  publishMonitoringEvent({ event_type: "log", level: method, action });
}

// The monitoring stream receives action codes. Local logs retain diagnostic detail.
export const logger = {
  info: (message: string, action: LogAction = "application_log") => write("INFO", message, action),
  warn: (message: string, action: LogAction = "application_log") => write("WARN", message, action),
  error: (message: string, error?: unknown, action: LogAction = "application_log") =>
    write("ERROR", message, action, error),
};

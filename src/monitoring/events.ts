export type LogAction =
  | "application_log"
  | "server_started"
  | "server_start_failed"
  | "request_handler_failed"
  | "next_request_error"
  | "unhandled_api_error"
  | "token_verification_failed"
  | "logout";

type LogLevel = "info" | "warn" | "error";

export type MonitoringEvent =
  | {
      event_type: "http";
      method: string;
      status_code?: number;
      outcome: "completed" | "client_error" | "server_error" | "aborted";
      duration_ms: number;
    }
  | { event_type: "log"; level: LogLevel; action: LogAction }
  | { event_type: "database"; action: "query"; duration_ms: number }
  | { event_type: "database"; action: "query_error" }
  | {
      event_type: "process";
      cpu_percent: number;
      rss_mib: number;
      heap_used_mib: number;
      event_loop_p95_ms: number;
    };

export type RequestContext = { route: string; request_id: string };

// The custom server and the bundled Next.js handlers have separate module caches.
const publisherKey = Symbol.for("web1-socialmedia.monitoring.publisher");
const runtime = globalThis as typeof globalThis & {
  [publisherKey]?: (event: MonitoringEvent) => void;
};

export function registerMonitoringPublisher(publish: (event: MonitoringEvent) => void) {
  runtime[publisherKey] = publish;
}

export function publishMonitoringEvent(event: MonitoringEvent) {
  runtime[publisherKey]?.(event);
}

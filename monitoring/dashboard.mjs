export const DATA_STREAM = "logs-web1.monitoring-default";
export const DASHBOARD_ID = "web1-app-monitoring";

const timeFilter = "@timestamp >= ?_tstart AND @timestamp <= ?_tend";
const timeBucket = "time_bucket = BUCKET(@timestamp, 45, ?_tstart, ?_tend)";
const count = { type: "number", decimals: 0 };
const decimal = { type: "number", decimals: 1 };

function source(type, ...commands) {
  return {
    type: "esql",
    query: [
      `FROM ${DATA_STREAM}`,
      `WHERE ${timeFilter} AND event_type == "${type}"`,
      ...commands,
    ].join("\n| "),
  };
}

function panel(title, [x, y, w, h], config) {
  return { type: "vis", grid: { x, y, w, h }, config: { title, ...config } };
}

function metric(title, x, dataSource, column, format) {
  return panel(title, [x, 0, 12, 5], {
    type: "metric",
    data_source: dataSource,
    metrics: [{ type: "primary", column, label: title, format }],
  });
}

function line(title, x, y, dataSource, series) {
  return panel(title, [x, y, 24, 11], {
    type: "xy",
    layers: [{
      type: "line",
      data_source: dataSource,
      x: { column: "time_bucket" },
      y: series.map(([column, label]) => ({ column, label })),
    }],
    axis: { x: { title: { visible: false } }, y: { title: { visible: false } } },
    legend: { visibility: "visible", position: "bottom" },
  });
}

function table(title, y, dataSource, rows, metrics = []) {
  return panel(title, [0, y, 48, 13], {
    type: "data_table",
    data_source: dataSource,
    rows: rows.map(([column, label]) => ({ column, label })),
    metrics: metrics.length > 0
      ? metrics.map(([column, label, format]) => ({ column, label, format }))
      : undefined,
  });
}

export const dashboard = {
  title: "WEB1 Social Media Monitoring",
  description: "HTTP traffic and latency, application events, Prisma queries, and Node.js resource usage.",
  time_range: { from: "now-1h", to: "now" },
  refresh_interval: { pause: false, value: 15_000 },
  panels: [
    metric("HTTP requests", 0, source("http", "STATS requests = COUNT(*)"), "requests", count),
    metric("HTTP 5xx rate", 12, source("http",
      'WHERE outcome != "aborted"',
      'STATS responses = COUNT(*), errors = COUNT(*) WHERE outcome == "server_error"',
      "EVAL error_rate = CASE(responses > 0, TO_DOUBLE(errors) / responses, 0.0)",
    ), "error_rate", { type: "percent", decimals: 2 }),
    metric("p95 HTTP latency (ms)", 24, source("http",
      'WHERE outcome != "aborted"',
      "STATS p95 = PERCENTILE(duration_ms, 95)",
    ), "p95", decimal),
    metric("Prisma errors", 36, source("database",
      'WHERE action == "query_error"',
      "STATS errors = COUNT(*)",
    ), "errors", count),
    line("HTTP requests by outcome", 0, 5, source("http",
      `STATS completed = COUNT(*) WHERE outcome == "completed",
        errors_4xx = COUNT(*) WHERE outcome == "client_error",
        errors_5xx = COUNT(*) WHERE outcome == "server_error",
        aborted = COUNT(*) WHERE outcome == "aborted" BY ${timeBucket}`,
    ), [["completed", "1xx–3xx"], ["errors_4xx", "4xx"], ["errors_5xx", "5xx"], ["aborted", "Aborted"]]),
    line("HTTP response latency (ms)", 24, 5, source("http",
      'WHERE outcome != "aborted"',
      `STATS p50 = PERCENTILE(duration_ms, 50), p95 = PERCENTILE(duration_ms, 95) BY ${timeBucket}`,
    ), [["p50", "p50"], ["p95", "p95"]]),
    line("Prisma query latency (ms)", 0, 16, source("database",
      'WHERE action == "query"',
      `STATS p50 = PERCENTILE(duration_ms, 50), p95 = PERCENTILE(duration_ms, 95) BY ${timeBucket}`,
    ), [["p50", "p50"], ["p95", "p95"]]),
    line("Node.js memory (MiB)", 24, 16, source("process",
      `STATS rss = MAX(rss_mib), heap = MAX(heap_used_mib) BY ${timeBucket}`,
    ), [["rss", "Peak RSS"], ["heap", "Peak heap used"]]),
    line("Node.js CPU (%)", 0, 27, source("process",
      `STATS peak_cpu = MAX(cpu_percent) BY ${timeBucket}`,
    ), [["peak_cpu", "Peak process CPU"]]),
    line("Node.js event-loop delay (ms)", 24, 27, source("process",
      `STATS peak_delay = MAX(event_loop_p95_ms) BY ${timeBucket}`,
    ), [["peak_delay", "Max sampled p95"]]),
    table("Busiest routes", 38, source("http",
      `STATS requests = COUNT(*),
        errors = COUNT(*) WHERE outcome == "server_error",
        p95 = PERCENTILE(duration_ms, 95) WHERE outcome != "aborted" BY method, route`,
      "SORT requests DESC",
      "LIMIT 15",
    ), [["method", "Method"], ["route", "Route"]], [
      ["requests", "Requests", count],
      ["errors", "5xx", count],
      ["p95", "p95 (ms)", decimal],
    ]),
    table("Recent failed or aborted requests", 51, source("http",
      'WHERE outcome != "completed"',
      "KEEP @timestamp, method, route, outcome, status_code, duration_ms, request_id",
      "SORT @timestamp DESC",
      "LIMIT 30",
    ), [
      ["@timestamp", "Time"], ["method", "Method"], ["route", "Route"],
      ["outcome", "Outcome"], ["request_id", "Request ID"],
    ], [["status_code", "HTTP status", count], ["duration_ms", "Duration (ms)", decimal]]),
    table("Recent application events", 64, source("log",
      "KEEP @timestamp, level, action, route, request_id",
      "SORT @timestamp DESC",
      "LIMIT 30",
    ), [
      ["@timestamp", "Time"], ["level", "Level"], ["action", "Event"],
      ["route", "Route"], ["request_id", "Request ID"],
    ]),
  ],
};

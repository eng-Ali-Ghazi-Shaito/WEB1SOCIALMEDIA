import { AsyncLocalStorage } from "node:async_hooks";
import type { IncomingMessage, ServerResponse } from "node:http";
import { monitorEventLoopDelay } from "node:perf_hooks";

import { env } from "../config/env";
import { ElasticsearchExporter } from "./elasticsearch";
import { publishMonitoringEvent, registerMonitoringPublisher, type RequestContext } from "./events";
import { trackRequest } from "./http";

const FLUSH_INTERVAL_MS = 1_000;
const PROCESS_SAMPLE_INTERVAL_MS = 15_000;
const BYTES_PER_MIB = 1_048_576;
const NANOS_PER_MILLISECOND = 1_000_000;

function sampleProcess() {
  const loopDelay = monitorEventLoopDelay({ resolution: 20 });
  loopDelay.enable();
  let sampledAt = performance.now();
  let lastCpu = process.cpuUsage();

  setInterval(() => {
    const now = performance.now();
    const cpu = process.cpuUsage();
    const usedMicros = cpu.user - lastCpu.user + cpu.system - lastCpu.system;
    const memory = process.memoryUsage();
    publishMonitoringEvent({
      event_type: "process",
      cpu_percent: 100 * usedMicros / ((now - sampledAt) * 1_000),
      rss_mib: memory.rss / BYTES_PER_MIB,
      heap_used_mib: memory.heapUsed / BYTES_PER_MIB,
      event_loop_p95_ms: loopDelay.percentile(95) / NANOS_PER_MILLISECOND,
    });
    sampledAt = now;
    lastCpu = cpu;
    loopDelay.reset();
  }, PROCESS_SAMPLE_INTERVAL_MS).unref();
}

export function startMonitoring() {
  const { ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY } = env;
  if (!ELASTICSEARCH_URL || !ELASTICSEARCH_API_KEY) {
    if (ELASTICSEARCH_URL || ELASTICSEARCH_API_KEY) {
      console.warn("[monitoring] Set both ELASTICSEARCH_URL and ELASTICSEARCH_API_KEY to enable telemetry.");
    }
    return undefined;
  }

  const exporter = new ElasticsearchExporter(ELASTICSEARCH_URL, ELASTICSEARCH_API_KEY, env.NODE_ENV);
  const requests = new AsyncLocalStorage<RequestContext>();
  registerMonitoringPublisher((event) => exporter.enqueue(event, requests.getStore()));
  setInterval(() => void exporter.flush(), FLUSH_INTERVAL_MS).unref();
  sampleProcess();

  return {
    handleRequest(req: IncomingMessage, res: ServerResponse, forward: () => void) {
      const context = trackRequest(req, res, (event, fields) => exporter.enqueue(event, fields));
      if (context) requests.run(context, forward);
      else forward();
    },
    flush: () => exporter.flush(),
  };
}

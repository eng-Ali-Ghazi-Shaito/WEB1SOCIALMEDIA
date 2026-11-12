import { randomUUID } from "node:crypto";

import type { MonitoringEvent, RequestContext } from "./events";

const DATA_STREAM = "logs-web1.monitoring-default";
const MAX_PENDING = 1_000;
const BATCH_SIZE = 100;
const REQUEST_TIMEOUT_MS = 2_000;
const RETRY_DELAY_MS = 5_000;
const WARNING_INTERVAL_MS = 60_000;

type Document = MonitoringEvent &
  Partial<RequestContext> & {
    "@timestamp": string;
    environment: string;
    instance_id: string;
  };

type Entry = { id: string; document: Document };

export class ElasticsearchExporter {
  private readonly endpoint: URL;
  private readonly instanceId = randomUUID();
  private pending: Entry[] = [];
  private flushing = false;
  private retryAfter = 0;
  private lastWarning = 0;

  constructor(url: string, private readonly apiKey: string, private readonly environment: string) {
    this.endpoint = new URL(`${url.replace(/\/$/, "")}/${DATA_STREAM}/_bulk`);
  }

  enqueue(event: MonitoringEvent, context?: RequestContext) {
    if (this.pending.length >= MAX_PENDING) {
      this.warn("the telemetry buffer is full. Events are being dropped.");
      return;
    }
    this.pending.push({
      id: randomUUID(),
      document: {
        ...event,
        ...context,
        "@timestamp": new Date().toISOString(),
        environment: this.environment,
        instance_id: this.instanceId,
      },
    });
  }

  async flush() {
    if (this.flushing || this.pending.length === 0 || Date.now() < this.retryAfter) return;
    this.flushing = true;
    const batch = this.pending.splice(0, BATCH_SIZE);
    try {
      const body = batch
        .map(({ id, document }) => `${JSON.stringify({ create: { _id: id } })}\n${JSON.stringify(document)}\n`)
        .join("");
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          Authorization: `ApiKey ${this.apiKey}`,
          "Content-Type": "application/x-ndjson",
        },
        body,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: "error",
      });
      if (!response.ok) {
        await response.body?.cancel();
        this.retry(batch, `Elasticsearch returned HTTP ${response.status}.`);
        return;
      }

      const result = (await response.json()) as { items?: { create?: { status?: number } }[] };
      const statuses = result?.items?.map((item) => item.create?.status ?? 0);
      if (statuses?.length !== batch.length || statuses.some((status) => !status)) {
        this.retry(batch, "Elasticsearch returned an incomplete bulk result.");
        return;
      }

      const retryable = (status: number) => status === 429 || status >= 500;
      this.retry(batch.filter((_, index) => retryable(statuses[index])), "Elasticsearch asked to retry bulk items.");
      // A prior attempt may have succeeded even if its response never arrived.
      const rejected = statuses.filter((status) => status >= 300 && status !== 409 && !retryable(status));
      if (rejected.length > 0) {
        this.warn(`Elasticsearch rejected ${rejected.length} telemetry events (HTTP ${rejected[0]}).`);
      }
    } catch {
      this.retry(batch, "Elasticsearch is unavailable.");
    } finally {
      this.flushing = false;
    }
  }

  private retry(entries: Entry[], message: string) {
    if (entries.length === 0) return;
    this.pending = entries.concat(this.pending).slice(0, MAX_PENDING);
    this.retryAfter = Date.now() + RETRY_DELAY_MS;
    this.warn(message);
  }

  private warn(message: string) {
    const now = Date.now();
    if (now - this.lastWarning < WARNING_INTERVAL_MS) return;
    this.lastWarning = now;
    console.warn(`[monitoring] ${message}`);
  }
}

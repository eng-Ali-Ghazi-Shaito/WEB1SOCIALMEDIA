import { appendFile, readFile } from "node:fs/promises";
import { parse } from "dotenv";

import { DATA_STREAM, DASHBOARD_ID, dashboard } from "./dashboard.mjs";

const envFile = new URL("../.env", import.meta.url);
const template = {
  index_patterns: [DATA_STREAM],
  priority: 501,
  data_stream: {},
  template: {
    lifecycle: { data_retention: "30d" },
    settings: { "index.auto_expand_replicas": "0-1" },
    mappings: {
      dynamic: "strict",
      properties: {
        "@timestamp": { type: "date" },
        environment: { type: "keyword" },
        instance_id: { type: "keyword" },
        event_type: { type: "keyword" },
        route: { type: "keyword" },
        request_id: { type: "keyword" },
        method: { type: "keyword" },
        outcome: { type: "keyword" },
        status_code: { type: "integer" },
        duration_ms: { type: "double" },
        level: { type: "keyword" },
        action: { type: "keyword" },
        cpu_percent: { type: "double" },
        rss_mib: { type: "double" },
        heap_used_mib: { type: "double" },
        event_loop_p95_ms: { type: "double" },
      },
    },
  },
};

function serviceUrl(value, name) {
  const url = new URL(value);
  const localHttp = url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname);
  if ((!localHttp && url.protocol !== "https:") || url.username || url.password || url.search || url.hash) {
    throw new Error(`${name} must be an HTTPS URL or a loopback HTTP URL, without credentials, query or fragment.`);
  }
  return url.href.replace(/\/$/, "");
}

async function api(base, path, authorization, method = "GET", body) {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { Authorization: authorization, "Content-Type": "application/json", "kbn-xsrf": "true" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
    redirect: "error",
  });
  if (method === "HEAD" && response.status === 404) return undefined;
  const result = method === "HEAD" ? undefined : await response.json().catch(() => undefined);
  if (!response.ok) {
    const detail = result?.error?.reason ?? result?.message ?? response.statusText;
    throw new Error(`${method} ${path} returned HTTP ${response.status}. ${detail}`);
  }
  return result ?? true;
}

async function setup() {
  const existingEnv = await readFile(envFile).catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });
  const appEnv = parse(existingEnv);
  const elasticUrl = serviceUrl(
    process.env.ELASTICSEARCH_URL ?? appEnv.ELASTICSEARCH_URL ?? "http://127.0.0.1:9200",
    "ELASTICSEARCH_URL",
  );
  const kibanaUrl = serviceUrl(process.env.KIBANA_URL ?? "http://127.0.0.1:5601", "KIBANA_URL");
  if (appEnv.ELASTICSEARCH_URL && serviceUrl(appEnv.ELASTICSEARCH_URL, "ELASTICSEARCH_URL") !== elasticUrl) {
    throw new Error("The Elasticsearch URL in .env differs from ELASTICSEARCH_URL in the shell.");
  }

  const username = process.env.ELASTIC_SETUP_USERNAME ?? "elastic";
  const password = process.env.ELASTIC_SETUP_PASSWORD;
  if (!password) throw new Error("Set ELASTIC_SETUP_PASSWORD for the Elasticsearch and Kibana administrator.");
  const authorization = `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`;

  await api(elasticUrl, "/_index_template/web1-monitoring", authorization, "PUT", template);
  const streamExists = await api(elasticUrl, `/${DATA_STREAM}`, authorization, "HEAD");
  if (!streamExists) {
    await api(elasticUrl, `/_data_stream/${DATA_STREAM}`, authorization, "PUT");
  }
  if (!appEnv.ELASTICSEARCH_API_KEY) {
    const key = await api(elasticUrl, "/_security/api_key", authorization, "POST", {
      name: "web1-monitoring-ingest",
      role_descriptors: {
        web1_monitoring: {
          indices: [{ names: [DATA_STREAM], privileges: ["create_doc"] }],
        },
      },
    });
    if (!key.encoded || !key.id) throw new Error("Elasticsearch did not return an encoded ingest key.");
    const settings = ["", "# WEB1 application monitoring"];
    if (!appEnv.ELASTICSEARCH_URL) settings.push(`ELASTICSEARCH_URL=${elasticUrl}`);
    settings.push(`ELASTICSEARCH_API_KEY=${key.encoded}`, "");
    try {
      await appendFile(envFile, settings.join("\n"), { mode: 0o600 });
    } catch (error) {
      await api(elasticUrl, "/_security/api_key", authorization, "DELETE", { ids: [key.id] });
      throw error;
    }
    console.info("Saved a write-only ingest key in the app's .env.");
  }

  await api(kibanaUrl, `/api/dashboards/${DASHBOARD_ID}`, authorization, "PUT", dashboard);
  console.info(`WEB1 Social Media Monitoring is ready at ${kibanaUrl}/app/dashboards#/view/${DASHBOARD_ID}`);
}

try {
  await setup();
} catch (error) {
  console.error(`Monitoring setup failed. ${error instanceof Error ? error.message : "Unknown error."}`);
  process.exitCode = 1;
}

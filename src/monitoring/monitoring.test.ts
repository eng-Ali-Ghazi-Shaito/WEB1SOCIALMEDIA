import { IncomingMessage, ServerResponse } from "node:http";
import { Socket } from "node:net";

import { afterEach, describe, expect, it, vi } from "vitest";

import { ElasticsearchExporter } from "./elasticsearch";
import { routeLabel, trackRequest } from "./http";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("HTTP monitoring", () => {
  it("keeps static routes, templates dynamic segments, and groups unknown paths", () => {
    expect(routeLabel("/api/users/me?token=private")).toBe("/api/users/me");
    expect(routeLabel("/api/conversations/private-id/messages?cursor=private"))
      .toBe("/api/conversations/:id/messages");
    expect(routeLabel("/users/private-username")).toBe("/users/:username");
    expect(routeLabel("/api/unknown/private-value")).toBe("/api/*");
    expect(routeLabel("/unknown/private-value")).toBe("other");
    expect(routeLabel("/_next/static/chunks/app.js")).toBeUndefined();
  });

  it("records a disconnect once without assigning a status before headers are sent", () => {
    const request = new IncomingMessage(new Socket());
    request.url = "/api/posts/private-id?cursor=private";
    request.method = "DELETE";
    const response = new ServerResponse(request);
    const record = vi.fn();
    const context = trackRequest(request, response, record);

    response.emit("close");
    response.emit("close");

    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith({
      event_type: "http",
      method: "DELETE",
      status_code: undefined,
      outcome: "aborted",
      duration_ms: expect.any(Number),
    }, { route: "/api/posts/:id", request_id: response.getHeader("X-Request-Id") });
    expect(context?.request_id).toBe(response.getHeader("X-Request-Id"));
  });
});

function bulkResult(...statuses: number[]) {
  return Response.json({ items: statuses.map((status) => ({ create: { status } })) });
}

function submittedIds(body: string) {
  return body.trimEnd().split("\n")
    .filter((_, index) => index % 2 === 0)
    .map((line) => JSON.parse(line).create._id);
}

describe("Elasticsearch delivery", () => {
  it("backs off during an outage and retries only temporary failures with stable IDs", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ["Date"] });
    const fetch = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(bulkResult(201, 429, 400))
      .mockResolvedValueOnce(bulkResult(409));
    vi.stubGlobal("fetch", fetch);
    const exporter = new ElasticsearchExporter("http://127.0.0.1:9200", "test-key", "test");
    for (let index = 0; index < 3; index++) {
      exporter.enqueue({ event_type: "log", level: "info", action: "server_started" });
    }

    await exporter.flush();
    await exporter.flush();
    expect(fetch).toHaveBeenCalledTimes(1);
    const firstIds = submittedIds(fetch.mock.calls[0][1].body);

    vi.setSystemTime(Date.now() + 5_001);
    await exporter.flush();
    expect(submittedIds(fetch.mock.calls[1][1].body)).toEqual(firstIds);

    vi.setSystemTime(Date.now() + 5_001);
    await exporter.flush();
    await exporter.flush();
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(submittedIds(fetch.mock.calls[2][1].body)).toEqual([firstIds[1]]);
  });
});

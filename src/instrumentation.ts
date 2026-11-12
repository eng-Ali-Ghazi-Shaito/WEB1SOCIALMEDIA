import type { Instrumentation } from "next";

import { publishMonitoringEvent } from "./monitoring/events";

export const onRequestError: Instrumentation.onRequestError = () => {
  publishMonitoringEvent({ event_type: "log", level: "error", action: "next_request_error" });
};

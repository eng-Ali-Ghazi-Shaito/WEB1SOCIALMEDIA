import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "src") },
  },
  test: {
    // Set before .env loads, and dotenv never overwrites: tests cannot reach Railway.
    env: {
      DATABASE_URL: "postgresql://test:test@127.0.0.1:5432/test",
      JWT_SECRET: "test-jwt-secret-with-at-least-32-characters",
      JWT_EXPIRES_IN: "1h",
      CODE_HMAC_SECRET: "test-hmac-secret-with-at-least-32-characters",
    },
  },
});

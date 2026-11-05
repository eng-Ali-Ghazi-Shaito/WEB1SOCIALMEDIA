// dotenv is loaded here because server.ts and the seed start before Next.js reads .env.
// Real environment variables win over .env, so Railway's values are never overwritten.
import "dotenv/config";
import { z } from "zod";

// HS256 uses a 256-bit key: a shorter secret would be weaker than the algorithm itself.
const JWT_SECRET_MIN_LENGTH = 32;
const DEFAULT_PORT = 3000;

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_SECRET: z.string().min(JWT_SECRET_MIN_LENGTH),
  JWT_EXPIRES_IN: z.string().min(1).default("1h"),
  CODE_HMAC_SECRET: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Railway assigns the port through PORT, so it cannot be hardcoded in server.ts.
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    return result.data;
  }

  // Fail at startup with every problem at once, not at the first request that needs a secret.
  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${problems}`);
}

export const env = loadEnv();

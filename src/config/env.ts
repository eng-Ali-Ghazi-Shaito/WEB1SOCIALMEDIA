//role to load env variables and validate them and other files import it instead of process.env
// dotenv is loaded here because server.ts and the seed start before Next.js reads .env.
// Real environment variables win over .env, so Railway's values are never overwritten.


//load .env into process.env
import "dotenv/config";
import { z } from "zod";

// HS256 uses a 256-bit key: a shorter secret would be weaker than the algorithm itself.
const JWT_SECRET_MIN_LENGTH = 32;
const DEFAULT_PORT = 3000;
const CODE_HMAC_SECRET_MIN_LENGTH = 32;

const envSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  JWT_SECRET: z.string().min(JWT_SECRET_MIN_LENGTH),
  JWT_EXPIRES_IN: z.string().regex(/^[1-9]\d*[smhd]$/, 'Must be a positive whole number plus s, m, h or d, like "15m" or "1h"').default("1h"),
  CODE_HMAC_SECRET: z.string().min(CODE_HMAC_SECRET_MIN_LENGTH),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  // Railway assigns the port through PORT, so it cannot be hardcoded in server.ts.
  PORT: z.coerce.number().int().positive().default(DEFAULT_PORT),
  APP_URL: z.url().default("http://localhost:3000"),
});

function loadEnv() {
  //safe parse returns { success: true, data } or { success: false, error }.
  //process.env is nodejs object that holds all env as key values.
  const result = envSchema.safeParse(process.env);
  if (result.success) {
    //data is fully typed object with data filled in zod.
    return result.data;
  }

  //Fail at startup with every problem at once, not at the first request that needs a secret.
  //issues shows all validations errors.
  //map makes the error readable string.
  //issue.path decides which variable caused the error.
  //issue.message explains the problem
  //join combine all errors to one string with new lines.
  const problems = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment variables:\n${problems}`);
}
//run it once import
export const env = loadEnv();
//TypeScript types = compile-time checking.
//Zod = runtime validation and conversion.
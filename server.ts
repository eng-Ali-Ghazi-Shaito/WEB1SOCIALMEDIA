import { env } from "./src/config/env";

import { createServer } from "http";
import next from "next";

const dev = env.NODE_ENV !== "production";

// A custom server instead of `next start`: Socket.io must attach to a long-lived HTTP server,
// which route handlers cannot provide.
const httpServer = createServer((req, res) => handle(req, res));
const app = next({ dev, httpServer, port: env.PORT });
const handle = app.getRequestHandler();

// SOCKET.IO: attach the Socket.io server to httpServer here, before it starts listening.

app
  .prepare()
  .then(() =>
    httpServer.listen(env.PORT, () => {
      console.info(`> Server listening at http://localhost:${env.PORT} as ${env.NODE_ENV}`);
    }),
  )
  .catch((error: unknown) => {
    // Exit non-zero: otherwise a failed boot looks like a running server and Railway won't restart it.
    console.error(error);
    process.exit(1);
  });

import { createServer } from "http";
import next from "next";

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";

// A custom server instead of `next start`: Socket.io must attach to a long-lived HTTP server,
// which route handlers cannot provide.
const httpServer = createServer((req, res) => handle(req, res));
const app = next({ dev, httpServer });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => httpServer.listen(port))
  .catch((error: unknown) => {
    // Exit non-zero: otherwise a failed boot looks like a running server and Railway won't restart it.
    console.error(error);
    process.exit(1);
  });

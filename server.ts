//server provide services/resources to clients.

//web server is server that handles http requests/response
//web server example: -software->nodejs http server/ -hardware->computer running the program.

//internent phyiscall infrastructure that connects devices to communicate.
//website group of web pages under one domain.
//web appliaction : website that user interact with like bank application users do payments.
//web came from world wide web so a page that can be accessed throuh internent(public or private since can be accessed  locally and can use private network) we call it web page
//browser means exploring something.
//web browser means exploring  www
//web: connected things
import { env } from "./src/config/env";
import { logger } from "./src/util/logger";
//creates http web server
import { createServer } from "http";
//create nextjs application.
import next from "next";

const dev = env.NODE_ENV !== "production";

// A custom server instead of `next start`: Socket.io must attach to a long-lived HTTP server,
// which route handlers cannot provide.

//handle is a function tells nextjs how to handle requests.
//example:visits hhttp://localhost:3000/dashboard the req:asking for dashboard and the response that will be sent back and the handle gives the nextjs the request to process the request. 
const httpServer = createServer((req, res) => handle(req, res));
//app is the nextjs application
const app = next({ dev, httpServer, port: env.PORT });
//nextjs provide a function that nows how to handle incomping http requests like /dash /login 
const handle = app.getRequestHandler();

// SOCKET.IO: attach the Socket.io server to httpServer here, before it starts listening.







//before recieving requests need to prepare its application

app
  .prepare()
  .then(() =>
    httpServer.listen(env.PORT, () => {
      logger.info(`Server listening at http://localhost:${env.PORT} as ${env.NODE_ENV}`);
    }),
  )
  .catch((error: unknown) => {

    // Exit non-zero: otherwise a failed boot looks like a running server and Railway won't restart it.
    logger.error("Server failed to start", error);
    process.exit(1);
  });

import process from "process";
import { Server } from "socket.io";
import { httpServer } from "./server.js";
import {
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "./types/events.js";

const io: Server = new Server<ClientToServerEvents, ServerToClientEvents>(
  httpServer,
  {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  },
);

export { io };

import process from "process";
import { Server } from "socket.io";
import { httpServer } from "./server";
import { ClientToServerEvents, ServerToClientEvents } from "./types/events";

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
        origin: process.env.FRONTEND_URL,
        credentials: true
    }
})

export { io }
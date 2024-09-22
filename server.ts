import express from "express";
import http from "http";

const app = express();
const httpServer = http.createServer(app);

export { app, httpServer }

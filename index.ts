import * as dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { json } from "express";
import { app, httpServer } from "./server.js";

import { verifyToken } from "./middleware/verifyToken.js";
import v1Router from "./routes/v1/router.js";
import { pingDatabase } from "./utils/database.js";
import { errorHandler } from "./utils/errorHandler.js";
import initializeSocket from "./features/socket/socket.js";

app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT"],
  }),
);

app.use(json());
app.use(cookieParser());
app.use(verifyToken);

app.get("/", (req, res) => {
  res.json("test");
});

app.use("/api/v1/", v1Router);
app.use(errorHandler);

initializeSocket();

app.use((req, res) => {
  res.status(404).json({ success: false, msg: "404 resource not found" });
});

httpServer.listen(process.env.PORT, async () => {
  console.log(`server listening on port ${process.env.PORT}`);
  pingDatabase();
});

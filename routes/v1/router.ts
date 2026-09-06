import { Router } from "express";
import authRouter from "../../features/auth/auth.routes.js";
import roomRouter from "../../features/room/room.routes.js";

const v1Router = Router();

v1Router.use(authRouter);
v1Router.use(roomRouter);

export default v1Router;
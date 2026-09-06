import { Router } from "express";
import authRouter from "../../features/auth/auth.routes.js";

const v1Router = Router();

v1Router.use(authRouter);

export default v1Router;
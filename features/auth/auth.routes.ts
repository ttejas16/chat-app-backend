import { Router } from "express";
import {
  getUserController,
  loginController,
  logoutController,
  signupController,
  updateUserController,
} from "./auth.controller.js";
import { upload } from "../../middleware/multer.js";
import { asyncErrorHandler } from "../../utils/errorHandler.js";

const authRouter = Router();

authRouter.post("/auth/login", asyncErrorHandler(loginController));
authRouter.post("/auth/signup", asyncErrorHandler(signupController));
authRouter.post("/auth/logout", logoutController);

authRouter.get("/auth/user", asyncErrorHandler(getUserController));
authRouter.put("/auth/user", upload.single("avatar"), asyncErrorHandler(updateUserController));

export default authRouter;

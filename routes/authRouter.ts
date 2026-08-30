import { Router } from "express";
import { upload } from '../middleware/multer';
import * as authController from "../controllers/authController";
import { z } from "zod";
import zValidator from "../middleware/validator";

const authRouter = Router();
export const userSchema = z.object({
    userName: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8)
})

authRouter.post('/login', authController.login);
authRouter.post('/logout', authController.logout);
authRouter.post('/signup', zValidator(userSchema), authController.signup);

authRouter.get('/getUser', authController.getUser);

authRouter.put('/updateProfile', upload.single("avatar"), authController.updateProfile);

export default authRouter;
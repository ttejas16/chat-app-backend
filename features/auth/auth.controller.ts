import { type Request, type Response } from "express";
import z from "zod";

import * as authService from "./auth.service.js";

export const userSchema = z.object({
  userName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function loginController(req: Request, res: Response) {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  const { user, accessToken } = await authService.login(email, password);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    expires: new Date(Date.now() + 65 * 60 * 1000),
  });

  res.status(200).json({ success: true, msg: "Login successfull", user });
}

export async function signupController(
  req: Request<{}, {}, z.infer<typeof userSchema>>,
  res: Response,
) {
  const userName = req.body.userName;
  const email = req.body.email;
  const password = req.body.password;

  await authService.signUp(email, password, userName);

  res.status(201).json({ success: true, msg: "User registered" });
}

export function logoutController(req: Request, res: Response) {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({ success: true, msg: "Logged Out" });
}

export async function getUserController(req: Request, res: Response) {
  const userId = req.user.id || "";

  const { user } = await authService.getUser(userId);

  res.status(200).json({ success: true, user });
}

export async function updateUserController(req: Request, res: Response) {
  const { avatar, userName, status } = req.body;
  const userId = req.user.id || "";

  const { user } = await authService.updateUser(
    userId,
    userName,
    status,
    avatar,
    req.file,
  );

  // if (updateCount == 0) {
  //   res.json({
  //     success: false,
  //     msg: "Cannot Update Profile Try Again Later! ",
  //   });
  //   return;
  // }

  res.json({
    success: true,
    msg: "Profile Updated",
    updatedProfile: user,
  });
}

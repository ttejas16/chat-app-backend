import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

import { User as UserType } from "../types/user";

import { uploadImage } from "../utils/cloudinaryUpload";
import z from "zod";
import { userSchema } from "../routes/authRouter";
import { prisma } from "../utils/database";

function createToken(payload: UserType) {
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!, {
    expiresIn: 60 * 60,
  });
  return token;
}

async function getUser(req: Request, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ success: false, msg: "Unauthorised!", user: {} });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: {
      hash: true,
    },
  });

  if (!user) {
    res.status(401).json({ success: false, msg: "Unauthorised!", user: {} });
    return;
  }

  res.status(200).json({ success: true, user: user });
}

async function updateProfile(req: Request, res: Response) {
  const { avatar, userName, status } = req.body;
  let newAvatarURL = null;

  if (req.file) {
    const result = await uploadImage(req.file);

    if (!result) {
      res
        .status(400)
        .json({ success: false, msg: "Can't process your request!" });
      return;
    }

    newAvatarURL = result;
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      avatar: newAvatarURL ? newAvatarURL : avatar,
      name: userName,
      status: status,
    },
    select: { id: true, email: true, name: true, avatar: true, status: true },
  });

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
    updatedProfile: updatedUser,
  });
}

async function login(req: Request, res: Response) {
  const email = req.body.email?.trim();
  const password = req.body.password?.trim();

  if (!email || !password) {
    res
      .status(400)
      .json({ success: false, msg: "Empty credentials are not allowed" });
    return;
  }

  // after validating input credentials
  const user = await prisma.user.findUnique({
    where: { email },
  });

  // check if no such user exists
  if (!user) {
    res.status(400).json({ success: false, msg: "Invalid credentials" });
    return;
  }

  try {
    // compare hash against plain text password
    const validPassword = await bcrypt.compare(password, user.hash);

    if (!validPassword) {
      res.status(400).json({ success: false, msg: "Invalid credentials" });
      return;
    }

    // create new access token
    //TODO: Making refresh tokens
    const token = createToken({ userName: user.name, id: user.id });
    res.cookie("accessToken", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      expires: new Date(Date.now() + 65 * 60 * 1000),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, msg: "Internal server error" });
    return;
  }

  // delete user.hash;
  const { hash, ...result } = user;
  console.log(result);

  res
    .status(200)
    .json({ success: true, msg: "Login successfull", user: result });
}

function logout(req: Request, res: Response) {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
  });

  res.status(200).json({ success: true, msg: "Logged Out!" });
}

async function signup(
  req: Request<{}, {}, z.infer<typeof userSchema>>,
  res: Response,
) {
  const userName = req.body.userName;
  const email = req.body.email;
  const password = req.body.password;

  if (!userName || !email || !password) {
    res
      .status(400)
      .json({ success: false, msg: "Empty credentials are not allowed" });
    return;
  }

  // after input validation
  const result = await prisma.user.findUnique({ where: { email: email } });
  if (result != null) {
    res
      .status(200)
      .json({ success: false, msg: "The email address is not avaliable" });
    return;
  }

  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // create a new user
    const _ = await prisma.user.create({
      data: {
        email: email,
        name: userName,
        hash: hash,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ success: false, msg: "Internal server error" });
    return;
  }

  res.status(200).json({ success: true, msg: "User registered" });
}

export { login, logout, signup, getUser, updateProfile };

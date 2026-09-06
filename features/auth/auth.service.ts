import bcrypt from "bcryptjs";

import { prisma } from "../../utils/database.js";
import ApiError from "../../utils/error.js";
import { createToken } from "../../utils/auth.js";
import { uploadImage } from "../../utils/cloudinaryUpload.js";

export async function login(email: string, password: string) {
  if (!email || !password) {
    throw new ApiError(400, "Invalid credentials");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new ApiError(400, "Invalid credentials");
  }

  const validPassword = await bcrypt.compare(password, user.hash);

  if (!validPassword) {
    throw new ApiError(400, "Invalid credentials");
  }

  //TODO: Making refresh tokens
  const token = createToken({ userName: user.name, id: user.id });

  const { hash, ...result } = user; // delete user.hash;

  return { user: result, accessToken: token };
}

export async function signUp(
  email: string,
  password: string,
  userName: string,
) {
  if (!userName || !email || !password) {
    throw new ApiError(400, "Invalid credentials");
  }

  // after input validation
  const result = await prisma.user.findUnique({ where: { email: email } });
  if (result != null) {
    throw new ApiError(400, "Invalid credentials");
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // create a new user
  const user = await prisma.user.create({
    data: {
      email: email,
      name: userName,
      hash: hash,
    },
  });

  return { user };
}

export async function getUser(userId: string) {
  if (!userId) {
    throw new ApiError(401, "Unauthorised");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    omit: {
      hash: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Unauthorised");
  }

  return { user };
}

export async function updateUser(
  userId: string,
  userName: string,
  status: string,
  avatar: string,
  file: Express.Multer.File | undefined,
) {
  let newAvatarURL = null;

  if (file) {
    const result = await uploadImage(file);

    if (!result) {
      throw new ApiError(503, "Can't process the request. Try again later.");
    }

    newAvatarURL = result;
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      avatar: newAvatarURL ? newAvatarURL : avatar,
      name: userName,
      status: status,
    },
    select: { id: true, email: true, name: true, avatar: true, status: true },
  });

  return { user };
}

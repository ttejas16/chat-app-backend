import { type User as UserType } from "../types/user.js";
import jwt from "jsonwebtoken";

function createToken(payload: UserType) {
  const token = jwt.sign(payload, process.env.JWT_SECRET_KEY!, {
    expiresIn: 60 * 60,
  });
  return token;
}

export { createToken }

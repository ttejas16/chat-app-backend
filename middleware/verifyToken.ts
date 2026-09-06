import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { type User } from "../types/user.js";

function verifyToken(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies?.accessToken as string;
    let user: User = {};

    try {
        if (token && jwt.verify(token, process.env.JWT_SECRET_KEY!)) {
            const payload = jwt.decode(token);

            if (payload && typeof payload != "string") {
                user = {
                    ...payload
                }
            }

        }

    } catch (err) {
        console.log("token expired or is invalid");
        // console.log(err);
    }

    req.user = user;
    next();
}

export { verifyToken };
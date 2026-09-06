import type { NextFunction, Request, RequestHandler, Response } from "express";
import ApiError from "./error.js";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: { message: err.message } });
  }

  console.error(err);

  return res.status(500).json({ error: { message: "Internal server error " } });
}

export function asyncErrorHandler(fn: RequestHandler): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    }
}

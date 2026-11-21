import type { NextFunction, Request, Response } from "express";
import { NotFoundError } from "../utils/AppError.js";

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}
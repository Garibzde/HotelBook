import type { NextFunction, Request, Response } from "express";
import type { Role } from "../generated/prisma/client.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new UnauthorizedError("Authentication required");
    }

    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError();
    }

    next();
  };
}
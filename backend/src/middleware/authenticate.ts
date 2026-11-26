import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { UnauthorizedError } from "../lib/errors.js";
import { verifyToken } from "../utils/jwt.js";

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Authentication required");
  }

  const token = header.slice("Bearer ".length).trim();
  const userId = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, managedHotelId: true },
  });

  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }

  req.user = {
    sub: user.id,
    role: user.role,
    managedHotelId: user.managedHotelId,
  };

  next();
}
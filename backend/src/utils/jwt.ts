import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";
import { UnauthorizedError } from "../lib/errors.js";

export function signToken(userId: number): string {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function verifyToken(token: string): number {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });

    if (typeof payload === "string" || !payload.sub) {
      throw new Error("Invalid token payload");
    }

    const userId = Number(payload.sub);

    if (!Number.isInteger(userId)) {
      throw new Error("Invalid token subject");
    }

    return userId;
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}
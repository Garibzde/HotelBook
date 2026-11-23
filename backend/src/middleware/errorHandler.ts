import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { AppError } from "../utils/AppError.js";
import { formatZodError } from "../utils/validate.js";
import { Prisma } from "../generated/prisma/client.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  } else if (err instanceof z.ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Validation failed";
    details = formatZodError(err);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      code = "DUPLICATE_ENTRY";
      message = "A record with this value already exists";
    } else if (err.code === "P2025") {
      statusCode = 404;
      code = "NOT_FOUND";
      message = "Record not found";
    } else if (err.code === "P2003") {
      statusCode = 409;
      code = "RELATED_RECORD_CONFLICT";
      message = "Operation conflicts with related records";
    }
  } else if (err instanceof SyntaxError && "body" in err) {
    statusCode = 400;
    code = "INVALID_JSON";
    message = "Request body contains invalid JSON";
  }

  if (statusCode >= 500) {
    logger.error({ err }, "Unhandled error");
  }

  const isDev = env.NODE_ENV !== "production";

  res.status(statusCode).json({
    success: false,
    message,
    code,
    ...(details !== undefined && { details }),
    ...(isDev && err instanceof Error && { stack: err.stack }),
  });
}
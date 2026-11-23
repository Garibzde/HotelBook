import { z } from "zod";
import { ValidationError } from "./AppError.js";

export function formatZodError(error: z.ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join(".") || "(root)",
    message: issue.message,
  }));
}

export function validate<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError("Validation failed", formatZodError(result.error));
  }

  return result.data;
}
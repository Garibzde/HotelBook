import type { Request, Response } from "express";
import { sendSuccess } from "../utils/response.js";
import { validate } from "../utils/validate.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";
import * as authService from "../services/auth.service.js";

export async function register(req: Request, res: Response) {
  const input = validate(registerSchema, req.body);
  const result = await authService.register(input);
  sendSuccess(res, result, "Registration successful", 201);
}

export async function login(req: Request, res: Response) {
  const input = validate(loginSchema, req.body);
  const result = await authService.login(input);
  sendSuccess(res, result, "Login successful");
}

export async function me(req: Request, res: Response) {
  const user = await authService.getProfile(req.user!.sub);
  sendSuccess(res, user);
}

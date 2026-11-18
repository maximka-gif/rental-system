import { Request, Response } from "express";
import { z } from "zod";
import * as auth from "../services/auth.service";

const registerSchema = z.object({
  email: z.string().email("Невірний email"),
  password: z.string().min(8, "Пароль мінімум 8 символів"),
  firstName: z.string().min(1, "Вкажіть ім'я"),
  lastName: z.string().min(1, "Вкажіть прізвище"),
  phone: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email("Невірний email"),
  password: z.string().min(1, "Введіть пароль"),
});

const tokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export async function register(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);
  const result = await auth.register(data);
  res.status(201).json(result);
}

export async function login(req: Request, res: Response) {
  const { email, password } = loginSchema.parse(req.body);
  const result = await auth.login(email, password);
  res.json(result);
}

export async function refresh(req: Request, res: Response) {
  const { refreshToken } = tokenSchema.parse(req.body);
  const result = await auth.refresh(refreshToken);
  res.json(result);
}

export async function logout(req: Request, res: Response) {
  const { refreshToken } = tokenSchema.parse(req.body);
  await auth.logout(refreshToken);
  res.status(204).end();
}

export async function me(_req: Request, res: Response) {
  const result = await auth.me(res.locals.user.id);
  res.json(result);
}
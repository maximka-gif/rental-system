import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/errors";

export type Role = "OWNER" | "TENANT" | "ADMIN";
export interface AuthUser {
  id: string;
  role: Role;
}

// перевіряє токен у заголовку Authorization: Bearer <token>
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new AppError(401, "Потрібна авторизація");
  }

  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as jwt.JwtPayload;
    res.locals.user = { id: payload.sub, role: payload.role } as AuthUser;
    next();
  } catch {
    throw new AppError(401, "Недійсний або прострочений токен");
  }
}

// пропускає тільки вказані ролі
export function requireRole(...roles: Role[]) {
  return (_req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user as AuthUser;
    if (!roles.includes(user.role)) {
      throw new AppError(403, "Недостатньо прав");
    }
    next();
  };
}
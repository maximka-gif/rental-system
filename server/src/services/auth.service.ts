import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../db";
import { AppError } from "../utils/errors";

const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
const REFRESH_DAYS = 7;

const publicUser = (u: any) => ({
  id: u.id,
  email: u.email,
  role: u.role,
  firstName: u.firstName,
  lastName: u.lastName,
  phone: u.phone,
});

async function issueTokens(user: { id: string; role: string }) {
  const accessToken = jwt.sign({ role: user.role }, process.env.JWT_SECRET!, {
    subject: user.id,
    expiresIn: "15m",
  });
  const refreshToken = crypto.randomBytes(48).toString("hex");
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_DAYS * 86400000),
    },
  });
  return { accessToken, refreshToken };
}

export async function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}) {
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) {
    throw new AppError(409, "Користувач з таким email вже існує");
  }

  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash: await bcrypt.hash(data.password, 10),
      role: "OWNER",
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    },
  });
  return { user: publicUser(user), ...(await issueTokens(user)) };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, "Невірний email або пароль");
  }

  const passwordOk = await bcrypt.compare(password, user.passwordHash);
  if (!passwordOk) {
    throw new AppError(401, "Невірний email або пароль");
  }

  if (!user.isActive) {
    throw new AppError(403, "Акаунт деактивовано");
  }

  return { user: publicUser(user), ...(await issueTokens(user)) };
}

export async function refresh(token: string) {
  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: sha(token) },
    include: { user: true },
  });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(401, "Сесія закінчилась");
  }

  // токен одноразовий: видаляємо старий і видаємо новий
  await prisma.refreshToken.delete({ where: { id: stored.id } });
  return { user: publicUser(stored.user), ...(await issueTokens(stored.user)) };
}

export async function logout(token: string) {
  await prisma.refreshToken.deleteMany({ where: { tokenHash: sha(token) } });
}

export async function me(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { tenantProfile: { select: { id: true } } },
  });
  if (!user) {
    throw new AppError(404, "Користувача не знайдено");
  }
  return { ...publicUser(user), tenantId: user.tenantProfile?.id ?? null };
}
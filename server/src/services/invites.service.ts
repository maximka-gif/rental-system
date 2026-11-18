import bcrypt from "bcryptjs";
import { prisma } from "../db";
import { AppError } from "../utils/errors";
import { INVITE_DAYS } from "./tenants.service";
import { login } from "./auth.service";

async function findValid(token: string) {
  const tenant = await prisma.tenant.findUnique({
    where: { inviteToken: token },
    include: { owner: true },
  });

  if (!tenant || tenant.userId) {
    throw new AppError(404, "Запрошення недійсне");
  }

  const invitedAt = tenant.invitedAt ?? tenant.createdAt;
  const expiresAt = invitedAt.getTime() + INVITE_DAYS * 86400000;
  if (expiresAt < Date.now()) {
    throw new AppError(410, "Термін дії запрошення минув. Попросіть власника надіслати нове.");
  }

  return tenant;
}

export async function getInvite(token: string) {
  const tenant = await findValid(token);

  return {
    firstName: tenant.firstName,
    lastName: tenant.lastName,
    email: tenant.email,
    ownerName: `${tenant.owner.firstName} ${tenant.owner.lastName}`,
  };
}

export async function accept(token: string, password: string) {
  const tenant = await findValid(token);

  const emailTaken = await prisma.user.findUnique({ where: { email: tenant.email } });
  if (emailTaken) {
    throw new AppError(409, "Користувач з таким email уже існує");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: tenant.email,
        passwordHash,
        role: "TENANT",
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        phone: tenant.phone,
      },
    });

    await tx.tenant.update({
      where: { id: tenant.id },
      data: { userId: user.id, inviteToken: null },
    });
  });

  // одразу входимо в акаунт і повертаємо токени
  return login(tenant.email, password);
}
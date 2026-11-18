import { z } from "zod";

export const tenantSchema = z.object({
  firstName: z.string().min(1, "Вкажіть ім'я"),
  lastName: z.string().min(1, "Вкажіть прізвище"),
  email: z.string().email("Невірний email"),
  phone: z.string().nullish(),
  documentNumber: z.string().nullish(),
  birthDate: z.coerce.date().nullish(),
  notes: z.string().nullish(),
});

export const tenantUpdateSchema = tenantSchema.partial();

export const tenantQuerySchema = z.object({
  search: z.string().optional(),
});

export const acceptInviteSchema = z.object({
  password: z.string().min(8, "Пароль мінімум 8 символів"),
});

export type TenantInput = z.infer<typeof tenantSchema>;
export type TenantUpdateInput = z.infer<typeof tenantUpdateSchema>;
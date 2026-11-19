import { z } from "zod";

const monthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export const invoiceQuerySchema = z.object({
  status: z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "CANCELLED"]).optional(),
  month: z.string().regex(monthRegex, "Формат місяця: РРРР-ММ").optional(),
  search: z.string().optional(),
});

export const generateSchema = z.object({
  month: z
    .string()
    .regex(monthRegex, "Формат місяця: РРРР-ММ")
    .default(() => new Date().toISOString().slice(0, 7)),
});

export const itemSchema = z.object({
  type: z.enum(["UTILITIES", "OTHER"]),
  description: z.string().min(1, "Вкажіть опис"),
  amount: z.coerce.number().positive("Сума має бути більшою за 0"),
});

export const manualPaymentSchema = z.object({
  amount: z.coerce.number().positive("Сума має бути більшою за 0"),
  method: z.enum(["CASH", "BANK_TRANSFER"]),
  paidAt: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now(), "Дата платежу не може бути в майбутньому")
    .optional(),
});
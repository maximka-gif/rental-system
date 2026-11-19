import { z } from "zod";

const leaseBase = z.object({
  propertyId: z.string().min(1, "Оберіть об'єкт"),
  tenantId: z.string().min(1, "Оберіть орендаря"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  rentAmount: z.coerce.number().positive("Вкажіть суму оренди"),
  depositAmount: z.coerce.number().min(0).default(0),
  paymentDay: z.coerce.number().int().min(1).max(28).default(1),
  penaltyRatePerDay: z.coerce.number().min(0).max(5).default(0.1),
  indexationPercent: z.coerce.number().min(0).max(100).default(0),
  autoRenew: z.boolean().default(false),
  notes: z.string().nullish(),
});

export const leaseSchema = leaseBase;
export const leaseUpdateSchema = leaseBase.partial();

export const leaseQuerySchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "EXPIRED", "TERMINATED"]).optional(),
  search: z.string().optional(),
});

export const terminateSchema = z.object({
  reason: z.string().min(1, "Вкажіть причину розірвання"),
});

export const renewSchema = z.object({
  months: z.coerce.number().int().min(1).max(36).default(12),
});

export type LeaseInput = z.infer<typeof leaseSchema>;
export type LeaseUpdateInput = z.infer<typeof leaseUpdateSchema>;
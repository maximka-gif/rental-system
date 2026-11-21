import { z } from "zod";

export const createRequestSchema = z.object({
  title: z.string().trim().min(1, "Вкажіть коротку назву проблеми"),
  description: z.string().trim().min(1, "Опишіть проблему"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const requestQuerySchema = z.object({
  status: z.enum(["NEW", "IN_PROGRESS", "DONE", "REJECTED"]).optional(),
  propertyId: z.string().optional(),
  search: z.string().optional(),
});

export const statusSchema = z.object({
  status: z.enum(["IN_PROGRESS", "DONE", "REJECTED"]),
  cost: z.coerce.number().min(0, "Вартість не може бути від'ємною").optional(),
});

export const commentSchema = z.object({
  text: z.string().trim().min(1, "Напишіть повідомлення"),
});
import { z } from "zod";

export const propertySchema = z.object({
  title: z.string().min(1, "Вкажіть назву"),
  type: z.enum(["APARTMENT", "HOUSE", "ROOM", "COMMERCIAL"]).default("APARTMENT"),
  status: z.enum(["VACANT", "RENTED", "MAINTENANCE"]).default("VACANT"),
  city: z.string().min(1, "Вкажіть місто"),
  address: z.string().min(1, "Вкажіть адресу"),
  area: z.coerce.number().positive("Площа має бути більшою за 0").nullish(),
  rooms: z.coerce.number().int().min(0).nullish(),
  floor: z.coerce.number().int().nullish(),
  description: z.string().nullish(),
  baseRent: z.coerce.number().positive("Вкажіть ціну оренди"),
  purchasePrice: z.coerce.number().positive().nullish(),
});

export const propertyUpdateSchema = propertySchema.partial();

export const propertyQuerySchema = z.object({
  status: z.enum(["VACANT", "RENTED", "MAINTENANCE"]).optional(),
  search: z.string().optional(),
});

export type PropertyInput = z.infer<typeof propertySchema>;
export type PropertyUpdateInput = z.infer<typeof propertyUpdateSchema>;
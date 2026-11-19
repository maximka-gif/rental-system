import { Request, Response } from "express";
import * as service from "../services/invoices.service";
import {
  invoiceQuerySchema,
  generateSchema,
  itemSchema,
  manualPaymentSchema,
} from "../schemas/invoice.schema";

export async function list(req: Request, res: Response) {
  const filters = invoiceQuerySchema.parse(req.query);
  res.json(await service.list(res.locals.user.id, filters));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.getById(res.locals.user.id, String(req.params.id)));
}

export async function generate(req: Request, res: Response) {
  const { month } = generateSchema.parse(req.body ?? {});
  res.status(201).json(await service.generateForMonth(month, res.locals.user.id));
}

export async function recalculate(_req: Request, res: Response) {
  res.json(await service.recalculateAll(res.locals.user.id));
}

export async function addItem(req: Request, res: Response) {
  const data = itemSchema.parse(req.body);
  res.status(201).json(await service.addItem(res.locals.user.id, String(req.params.id), data));
}

export async function recordPayment(req: Request, res: Response) {
  const data = manualPaymentSchema.parse(req.body);
  res
    .status(201)
    .json(await service.recordPayment(res.locals.user.id, String(req.params.id), data));
}

export async function cancel(req: Request, res: Response) {
  res.json(await service.cancel(res.locals.user.id, String(req.params.id)));
}
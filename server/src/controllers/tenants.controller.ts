import { Request, Response } from "express";
import * as service from "../services/tenants.service";
import { tenantSchema, tenantUpdateSchema, tenantQuerySchema } from "../schemas/tenant.schema";

export async function list(req: Request, res: Response) {
  const filters = tenantQuerySchema.parse(req.query);
  res.json(await service.list(res.locals.user.id, filters));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.getById(res.locals.user.id, String(req.params.id)));
}

export async function create(req: Request, res: Response) {
  const data = tenantSchema.parse(req.body);
  res.status(201).json(await service.create(res.locals.user.id, data));
}

export async function update(req: Request, res: Response) {
  const data = tenantUpdateSchema.parse(req.body);
  res.json(await service.update(res.locals.user.id, String(req.params.id), data));
}

export async function remove(req: Request, res: Response) {
  await service.remove(res.locals.user.id, String(req.params.id));
  res.status(204).end();
}

export async function createInvite(req: Request, res: Response) {
  res.status(201).json(await service.createInvite(res.locals.user.id, String(req.params.id)));
}
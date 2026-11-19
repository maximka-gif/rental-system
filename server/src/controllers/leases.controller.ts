import { Request, Response } from "express";
import * as service from "../services/leases.service";
import {
  leaseSchema,
  leaseUpdateSchema,
  leaseQuerySchema,
  terminateSchema,
  renewSchema,
} from "../schemas/lease.schema";

export async function list(req: Request, res: Response) {
  const filters = leaseQuerySchema.parse(req.query);
  res.json(await service.list(res.locals.user.id, filters));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.getById(res.locals.user.id, String(req.params.id)));
}

export async function create(req: Request, res: Response) {
  const data = leaseSchema.parse(req.body);
  res.status(201).json(await service.create(res.locals.user.id, data));
}

export async function update(req: Request, res: Response) {
  const data = leaseUpdateSchema.parse(req.body);
  res.json(await service.update(res.locals.user.id, String(req.params.id), data));
}

export async function remove(req: Request, res: Response) {
  await service.remove(res.locals.user.id, String(req.params.id));
  res.status(204).end();
}

export async function activate(req: Request, res: Response) {
  res.json(await service.activate(res.locals.user.id, String(req.params.id)));
}

export async function terminate(req: Request, res: Response) {
  const { reason } = terminateSchema.parse(req.body);
  res.json(await service.terminate(res.locals.user.id, String(req.params.id), reason));
}

export async function renew(req: Request, res: Response) {
  const { months } = renewSchema.parse(req.body ?? {});
  res.json(await service.renew(res.locals.user.id, String(req.params.id), months));
}
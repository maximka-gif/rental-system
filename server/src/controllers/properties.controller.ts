import { Request, Response } from "express";
import * as service from "../schemas/properties.service";
import {
  propertySchema,
  propertyUpdateSchema,
  propertyQuerySchema,
} from "../schemas/property.schema";

export async function list(req: Request, res: Response) {
  const filters = propertyQuerySchema.parse(req.query);
  res.json(await service.list(res.locals.user.id, filters));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.getById(res.locals.user.id, String(req.params.id)));
}

export async function create(req: Request, res: Response) {
  const data = propertySchema.parse(req.body);
  res.status(201).json(await service.create(res.locals.user.id, data));
}

export async function update(req: Request, res: Response) {
  const data = propertyUpdateSchema.parse(req.body);
  res.json(await service.update(res.locals.user.id, String(req.params.id), data));
}

export async function remove(req: Request, res: Response) {
  await service.remove(res.locals.user.id, String(req.params.id));
  res.status(204).end();
}
import { Request, Response } from "express";
import * as service from "../services/requests.service";
import {
  createRequestSchema,
  requestQuerySchema,
  statusSchema,
  commentSchema,
} from "../schemas/request.schema";

function actor(res: Response) {
  return res.locals.user as { id: string; role: "OWNER" | "TENANT" | "ADMIN" };
}

export async function list(req: Request, res: Response) {
  const filters = requestQuerySchema.parse(req.query);
  res.json(await service.list(actor(res), filters));
}

export async function getById(req: Request, res: Response) {
  res.json(await service.getById(actor(res), String(req.params.id)));
}

export async function create(req: Request, res: Response) {
  const data = createRequestSchema.parse(req.body);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  res.status(201).json(await service.create(actor(res).id, data, files));
}

export async function addComment(req: Request, res: Response) {
  const { text } = commentSchema.parse(req.body);
  res.status(201).json(await service.addComment(actor(res), String(req.params.id), text));
}

export async function changeStatus(req: Request, res: Response) {
  const { status, cost } = statusSchema.parse(req.body);
  res.json(await service.changeStatus(actor(res).id, String(req.params.id), status, cost));
}
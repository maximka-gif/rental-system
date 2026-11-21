import { Request, Response } from "express";
import * as service from "../services/cabinet.service";

export async function summary(_req: Request, res: Response) {
  res.json(await service.summary(res.locals.user.id));
}

export async function listInvoices(_req: Request, res: Response) {
  res.json(await service.listInvoices(res.locals.user.id));
}

export async function getInvoice(req: Request, res: Response) {
  res.json(await service.getInvoice(res.locals.user.id, String(req.params.id)));
}
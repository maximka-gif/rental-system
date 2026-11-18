import { Request, Response } from "express";
import * as service from "../services/invites.service";
import { acceptInviteSchema } from "../schemas/tenant.schema";

export async function getInvite(req: Request, res: Response) {
  res.json(await service.getInvite(String(req.params.token)));
}

export async function accept(req: Request, res: Response) {
  const { password } = acceptInviteSchema.parse(req.body);
  res.status(201).json(await service.accept(String(req.params.token), password));
}
import { Request, Response } from "express";
import { z } from "zod";
import * as service from "../services/payments.service";
import * as liqpay from "../services/liqpay.service";
import { AppError } from "../utils/errors";

const mockSchema = z.object({ success: z.boolean() });

export async function checkout(req: Request, res: Response) {
  res.status(201).json(await service.startCheckout(res.locals.user.id, String(req.params.invoiceId)));
}

export async function sync(req: Request, res: Response) {
  res.json(await service.sync(res.locals.user.id, String(req.params.orderId)));
}

export async function mockComplete(req: Request, res: Response) {
  const { success } = mockSchema.parse(req.body);
  res.json(await service.mockComplete(res.locals.user.id, String(req.params.orderId), success));
}

// вебхук LiqPay: публічний, але кожен запит перевіряємо за підписом
export async function liqpayCallback(req: Request, res: Response) {
  const data = req.body?.data;
  const signature = req.body?.signature;

  if (typeof data !== "string" || typeof signature !== "string" || !liqpay.verify(data, signature)) {
    throw new AppError(400, "Невірний підпис");
  }

  const payload = liqpay.decode(data);
  await service.applyResult(String(payload.order_id), String(payload.status), payload);
  res.status(200).end();
}
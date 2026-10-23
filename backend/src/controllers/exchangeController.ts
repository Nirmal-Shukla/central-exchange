import { orderBodySchema } from "../types/exchange-schema";
import { sendToEngine } from "../utils/engine-client";
import { sendValidationError } from "../utils/validation";
import type { Request,Response } from "express";


function getUserId(req: Request): string {
  if (!req.userId) throw new Error("Missing authenticated user");
  return req.userId;
}

export async function createOrder(req: Request, res: Response): Promise<void> {
  const userId = getUserId(req);

  const parsedBody = orderBodySchema.safeParse(req.body);
  if (!parsedBody.success) {
    sendValidationError(res, parsedBody.error);
    return;
  }

  const { type, side, symbol, qty } = parsedBody.data;
  const price = type === "market" ? null : parsedBody.data.price;


const engineResponse = await sendToEngine("create order", {
    userId,
    type,
    side,
    symbol,
    price: type === "market" ? null : price,
    qty,
  });

  
  res.status(engineResponse.ok ? 200 : 400).json(
    engineResponse.ok
      ? engineResponse.data
      : {
          error: engineResponse.error,
        },
  );
}
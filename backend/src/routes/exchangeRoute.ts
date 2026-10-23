import { Router } from "express";
import {
  createOrder,
} from "../controllers/exchangeController.ts";
requireAuth
import { asyncHandler } from "../utils/asyncHandler.ts";
import { requireAuth } from "../utils/auth.ts";

export const exchangeRouter = Router();

exchangeRouter.post("/order", requireAuth, asyncHandler(createOrder));


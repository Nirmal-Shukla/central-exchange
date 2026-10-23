import { Router } from "express";
import { signin, signup } from "../controllers/auth-controller.ts";
import { asyncHandler } from "../utils/asyncHandler.ts";

export const authRouter = Router();

authRouter.post("/signup", asyncHandler(signup));
authRouter.post("/signin",asyncHandler(signin))


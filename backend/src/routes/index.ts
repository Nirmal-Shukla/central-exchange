import { Router } from "express";
import { authRouter } from "./auth-routes.ts";
import { exchangeRouter } from "./exchangeRoute.ts";

export const appRouter = Router();

appRouter.use(authRouter);
appRouter.use(exchangeRouter)
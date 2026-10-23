import cors from "cors";
import express from "express";
import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { env } from "../utils/env.ts";
import { prisma } from "./db.ts";
import { appRouter } from "./routes/index.ts";
import {
  connectRedis,
  listenForEngineResponses,
  pingRedis,
} from "./utils/engine-client.ts";

async function startBackend(): Promise<void> {
  // 1. Connect required dependencies before accepting requests.
  await prisma.$connect();
  await connectRedis();

  const redisResponse = await pingRedis();
  console.log(`Redis connection: ${redisResponse}`);

  // 2. Start the permanent response listener in the background.
  // Do not await it because it contains an infinite BRPOP loop.
  void listenForEngineResponses().catch((error) => {
    console.error("Engine response listener stopped", error);
    process.exit(1);
  });

  // 3. Configure Express.
  const app = express();

  app.use(cors());
  app.use(express.json());

  // 4. Register health check.
  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      ok: true,
    });
  });

  // 5. Register application routes.
  app.use(appRouter);

  // 6. Handle unknown routes.
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: "route_not_found",
    });
  });

  // 7. Error middleware must be registered last.
  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      console.error(error);

      if (
        error instanceof Error &&
        error.message === "Engine response timed out"
      ) {
        res.status(504).json({
          error: "engine_response_timeout",
        });
        return;
      }

      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : "internal_server_error",
      });
    },
  );

  // 8. Accept HTTP requests only after dependencies and listener are ready.
  app.listen(env.port, () => {
    console.log(
      `Backend running on http://localhost:${env.port}`,
    );
  });
}

startBackend().catch((error) => {
  console.error("Backend startup failed", error);
  process.exit(1);
});
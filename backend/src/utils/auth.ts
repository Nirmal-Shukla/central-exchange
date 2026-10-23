import jwt from "jsonwebtoken";
import type {
  Request,
  Response,
  NextFunction,
} from "express";
import { env } from "../../utils/env.ts";

export interface TokenPayload {
  userId: string;
}

export function createToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    res.status(401).json({
      error: "Authentication required",
    });
    return;
  }

  const token = authorization.slice(7);

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);

    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string"
    ) {
      res.status(401).json({
        error: "Invalid token",
      });
      return;
    }

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({
      error: "Invalid or expired token",
    });
  }
}
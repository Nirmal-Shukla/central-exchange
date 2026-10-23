import type { RequestHandler } from "express";

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return function (req, res, next) {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

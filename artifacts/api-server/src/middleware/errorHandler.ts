import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error({ err, requestId: req.requestId }, "Unhandled error");
  if (res.headersSent) return;
  res.status(500).json({ error: "Internal server error" });
}

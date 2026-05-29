import { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger.js";

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  logger.error(
    { err, message: err.message, stack: err.stack, requestId: req.requestId },
    "Unhandled error",
  );
  if (res.headersSent) return;

  const anyErr = err as unknown as {
    code?: unknown;
    errno?: unknown;
    sqlState?: unknown;
    sqlMessage?: unknown;
    cause?: { message?: unknown; sqlMessage?: unknown; code?: unknown };
  };

  res.status(500).json({
    error: "Internal server error",
    message: err.message,
    code: anyErr.code,
    sqlMessage: anyErr.sqlMessage,
    sqlState: anyErr.sqlState,
    causeMessage: anyErr.cause?.message,
    causeSqlMessage: anyErr.cause?.sqlMessage,
    causeCode: anyErr.cause?.code,
  });
}

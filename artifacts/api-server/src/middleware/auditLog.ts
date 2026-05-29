import { Request, Response, NextFunction } from "express";
import { db, auditLogsTable } from "@workspace/db";

export function auditLog(action: string, entityType?: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    next();

    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const entityId = rawId ? parseInt(rawId, 10) : undefined;
        db.insert(auditLogsTable).values({
          userId: req.user?.sub,
          action,
          entityType: entityType ?? null,
          entityId: entityId ?? null,
          metadata: { body: req.method !== "GET" ? req.body : undefined, query: req.query },
          ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress ?? null,
          userAgent: req.headers["user-agent"] ?? null,
        }).catch(() => {});
      }
    });
  };
}

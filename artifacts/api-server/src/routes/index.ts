import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";

const router: IRouter = Router();

// TEMP: keep server bootable while DB schema is being migrated to MySQL.
// This prevents importing other routers that may still reference Postgres-only schema.
router.use(healthRouter);
router.use(authRouter);

export default router;

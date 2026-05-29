import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { hashPassword } from "../../lib/auth.js";
import { requireStrictAdmin } from "../../middleware/requireAuth.js";
import { z } from "zod";

const router: IRouter = Router();

const CreateUserBody = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(50),
  password: z.string().min(8),
  role: z.enum(["admin", "editor", "viewer"]).default("editor"),
});

router.get("/admin/users", requireStrictAdmin, async (_req, res): Promise<void> => {
  const users = await db
    .select({ id: usersTable.id, email: usersTable.email, username: usersTable.username, role: usersTable.role, isActive: usersTable.isActive, lastLoginAt: usersTable.lastLoginAt, createdAt: usersTable.createdAt })
    .from(usersTable)
    .orderBy(usersTable.createdAt);
  res.json(users);
});

router.post("/admin/users", requireStrictAdmin, async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, username, password, role } = parsed.data;
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({ email: email.toLowerCase(), username, passwordHash, role })
    .returning({ id: usersTable.id, email: usersTable.email, username: usersTable.username, role: usersTable.role });

  res.status(201).json(user);
});

router.delete("/admin/users/:id", requireStrictAdmin, async (req, res): Promise<void> => {
  const id = parseInt(req.params.id as string, 10);
  if (req.user?.sub === id) {
    res.status(400).json({ error: "Cannot delete your own account" });
    return;
  }
  await db.update(usersTable).set({ isActive: false }).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

export default router;

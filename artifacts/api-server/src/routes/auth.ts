import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, usersTable, sessionsTable } from "@workspace/db";
import { hashPassword, verifyPassword, generateRefreshToken, hashRefreshToken } from "../lib/auth.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken, REFRESH_TOKEN_TTL_MS } from "../lib/jwt.js";
import { requireAuth } from "../middleware/requireAuth.js";
import rateLimit from "express-rate-limit";
import { z } from "zod";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const LoginBody = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

const router: IRouter = Router();

router.post("/auth/login", loginLimiter, async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid credentials format" });
    return;
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.email, email.toLowerCase()), eq(usersTable.isActive, true)))
    .limit(1);

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const accessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  const refreshToken = generateRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await db.insert(sessionsTable).values({
    userId: user.id,
    refreshTokenHash,
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: (req.headers["x-forwarded-for"] as string)?.split(",")[0] ?? req.socket.remoteAddress ?? null,
    expiresAt,
  });

  await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));

  res.cookie("access_token", accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });
  res.cookie("refresh_token", refreshToken, { ...COOKIE_OPTS, maxAge: REFRESH_TOKEN_TTL_MS });

  res.json({ user: { id: user.id, email: user.email, username: user.username, role: user.role } });
});

router.post("/auth/logout", requireAuth, async (req, res): Promise<void> => {
  const refreshToken = req.cookies?.refresh_token as string | undefined;
  if (refreshToken) {
    const hash = hashRefreshToken(refreshToken);
    await db.delete(sessionsTable).where(eq(sessionsTable.refreshTokenHash, hash));
  }
  res.clearCookie("access_token", COOKIE_OPTS);
  res.clearCookie("refresh_token", COOKIE_OPTS);
  res.json({ ok: true });
});

router.post("/auth/refresh", async (req, res): Promise<void> => {
  const refreshToken = req.cookies?.refresh_token as string | undefined;
  if (!refreshToken) {
    res.status(401).json({ error: "No refresh token" });
    return;
  }

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
    return;
  }

  const hash = hashRefreshToken(refreshToken);
  const [session] = await db
    .select()
    .from(sessionsTable)
    .where(and(eq(sessionsTable.refreshTokenHash, hash), gt(sessionsTable.expiresAt, new Date())))
    .limit(1);

  if (!session) {
    res.status(401).json({ error: "Session expired or revoked" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, session.userId), eq(usersTable.isActive, true)))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const newAccessToken = signAccessToken({ sub: user.id, email: user.email, role: user.role });
  res.cookie("access_token", newAccessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 });

  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email, username: usersTable.username, role: usersTable.role })
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.sub))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(user);
});

export default router;

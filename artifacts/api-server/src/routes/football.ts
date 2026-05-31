import { Router, type IRouter } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, footballTeamsTable, footballPredictionRequestsTable } from "@workspace/db";
import { requireAuth } from "../middleware/requireAuth.js";

const router: IRouter = Router();

type TeamRow = typeof footballTeamsTable.$inferSelect;

const MOCK_TEAMS: Array<{
  sport: string;
  slug: string;
  name: string;
  countryCode: string;
  strengthRating: number;
}> = [
    { sport: "football", slug: "al-ahly", name: "Al Ahly", countryCode: "EG", strengthRating: 1700 },
    { sport: "football", slug: "zamalek", name: "Zamalek", countryCode: "EG", strengthRating: 1600 },
    { sport: "football", slug: "real-madrid", name: "Real Madrid", countryCode: "ES", strengthRating: 1850 },
    { sport: "football", slug: "barcelona", name: "Barcelona", countryCode: "ES", strengthRating: 1780 },
    { sport: "football", slug: "juventus", name: "Juventus", countryCode: "IT", strengthRating: 1720 },
    { sport: "football", slug: "inter", name: "Inter", countryCode: "IT", strengthRating: 1760 },
    { sport: "football", slug: "bayern-munich", name: "Bayern Munich", countryCode: "DE", strengthRating: 1880 },
    { sport: "football", slug: "borussia-dortmund", name: "Borussia Dortmund", countryCode: "DE", strengthRating: 1690 },
    { sport: "football", slug: "psg", name: "PSG", countryCode: "FR", strengthRating: 1810 },
    { sport: "football", slug: "marseille", name: "Marseille", countryCode: "FR", strengthRating: 1580 },
    { sport: "football", slug: "man-united", name: "Manchester United", countryCode: "UK", strengthRating: 1740 },
    { sport: "football", slug: "liverpool", name: "Liverpool", countryCode: "UK", strengthRating: 1770 },
    { sport: "football", slug: "porto", name: "Porto", countryCode: "PT", strengthRating: 1650 },
    { sport: "football", slug: "benfica", name: "Benfica", countryCode: "PT", strengthRating: 1620 },
    { sport: "football", slug: "flamengo", name: "Flamengo", countryCode: "BR", strengthRating: 1680 },
    { sport: "football", slug: "palmeiras", name: "Palmeiras", countryCode: "BR", strengthRating: 1660 },
    { sport: "football", slug: "boca-juniors", name: "Boca Juniors", countryCode: "AR", strengthRating: 1670 },
    { sport: "football", slug: "river-plate", name: "River Plate", countryCode: "AR", strengthRating: 1700 },
    { sport: "football", slug: "al-hilal", name: "Al Hilal", countryCode: "SA", strengthRating: 1740 },
    { sport: "football", slug: "al-nassr", name: "Al Nassr", countryCode: "SA", strengthRating: 1710 },
  ];

function seedTeamsIfEmpty() {
  return (async () => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(footballTeamsTable);

    if (count > 0) return;

    await db.insert(footballTeamsTable).values(MOCK_TEAMS as any);
  })();
}

router.get("/football/teams", async (req, res) => {
  const countryCode = typeof req.query.countryCode === "string" ? req.query.countryCode : undefined;

  try {
    await seedTeamsIfEmpty();

    const where = countryCode ? eq(footballTeamsTable.countryCode, countryCode) : undefined;

    const teams = await db
      .select()
      .from(footballTeamsTable)
      .where(where)
      .orderBy(footballTeamsTable.countryCode)
      .orderBy(footballTeamsTable.name);

    res.json({ items: teams });
  } catch (_err) {
    res.status(500).json({ error: "Failed to load football teams" });
  }
});

const PredictBodySchema = z.object({
  teamAId: z.number().int().positive(),
  teamBId: z.number().int().positive(),
});

router.post("/football/predict", requireAuth, async (req, res): Promise<void> => {
  const body = PredictBodySchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { teamAId, teamBId } = body.data;

  if (teamAId === teamBId) {
    res.status(400).json({ error: "Pick two different teams" });
    return;
  }

  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(footballPredictionRequestsTable)
      .where(
        and(
          eq(footballPredictionRequestsTable.userId, userId),
          gte(footballPredictionRequestsTable.createdAt, cutoff),
        ),
      );

    if (count >= 10) {
      res.status(429).json({ error: "Limit exceeded: 10 predictions per 24 hours" });
      return;
    }

    const [teamA, teamB] = await Promise.all([
      db.select().from(footballTeamsTable).where(eq(footballTeamsTable.id, teamAId)).limit(1),
      db.select().from(footballTeamsTable).where(eq(footballTeamsTable.id, teamBId)).limit(1),
    ]);

    if (!teamA[0] || !teamB[0]) {
      res.status(404).json({ error: "Team not found" });
      return;
    }

    const a = teamA[0];
    const b = teamB[0];

    // Poisson-ish MVP: expected goals from strength difference.
    // lambda = base * exp((S_self - S_other)/400)
    const base = 1.35;
    const lambdaA = base * Math.exp((a.strengthRating - b.strengthRating) / 400);
    const lambdaB = base * Math.exp((b.strengthRating - a.strengthRating) / 400);

    function poissonP(k: number, lambda: number) {
      // P(K=k) = e^-lambda * lambda^k / k!
      let fact = 1;
      for (let i = 2; i <= k; i++) fact *= i;
      return Math.exp(-lambda) * Math.pow(lambda, k) / fact;
    }

    const maxGoals = 6;
    const pA: number[] = [];
    const pB: number[] = [];
    for (let g = 0; g <= maxGoals; g++) {
      pA[g] = poissonP(g, lambdaA);
      pB[g] = poissonP(g, lambdaB);
    }

    let winA = 0;
    let draw = 0;
    let winB = 0;

    let bestScore = { a: 0, b: 0, prob: -1 };

    for (let ga = 0; ga <= maxGoals; ga++) {
      for (let gb = 0; gb <= maxGoals; gb++) {
        const prob = pA[ga] * pB[gb];
        if (ga > gb) winA += prob;
        else if (ga === gb) draw += prob;
        else winB += prob;

        if (prob > bestScore.prob) bestScore = { a: ga, b: gb, prob };
      }
    }

    const inputKey = `${a.slug}__${b.slug}`;

    await db.insert(footballPredictionRequestsTable).values({
      userId,
      teamAId,
      teamBId,

      predictedScoreA: bestScore.a,
      predictedScoreB: bestScore.b,

      expectedGoalsA: String(lambdaA.toFixed(3)),
      expectedGoalsB: String(lambdaB.toFixed(3)),

      winAProb: String(winA.toFixed(4)),
      drawProb: String(draw.toFixed(4)),
      winBProb: String(winB.toFixed(4)),

      inputKey,
      status: "pending",
      isSuccess: 1,
    });

    res.json({
      teams: { a, b },
      expectedGoals: { a: lambdaA, b: lambdaB },
      probabilities: {
        winA,
        draw,
        winB,
      },
      predictedScore: { a: bestScore.a, b: bestScore.b },
    });
    return;
  } catch (_err) {
    res.status(500).json({ error: "Failed to predict" });
    return;
  }
});

router.get("/admin/football/predictions", requireAuth, async (req, res): Promise<void> => {
  // MVP: allow admin/editor to see predictions
  if (req.user?.role !== "admin" && req.user?.role !== "editor") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const limit = typeof req.query.limit === "string" ? Number(req.query.limit) : 50;
  const safeLimit = Number.isFinite(limit) && limit > 0 && limit <= 200 ? Math.floor(limit) : 50;

  try {
    const predictions = await db
      .select()
      .from(footballPredictionRequestsTable)
      .orderBy(footballPredictionRequestsTable.createdAt)
      .limit(safeLimit);

    // Load teams (N+1 is fine for MVP)
    const items = await Promise.all(
      predictions.map(async (p: typeof footballPredictionRequestsTable.$inferSelect) => {
        const [teamA, teamB] = await Promise.all([
          db.select().from(footballTeamsTable).where(eq(footballTeamsTable.id, p.teamAId)).limit(1),
          db.select().from(footballTeamsTable).where(eq(footballTeamsTable.id, p.teamBId)).limit(1),
        ]);

        return {
          ...p,
          teamA: teamA[0] ?? null,
          teamB: teamB[0] ?? null,
        };
      }),
    );

    res.json({ items });
    return;
  } catch (_err) {
    res.status(500).json({ error: "Failed to load predictions" });
    return;
  }
});

const ResolvePredictionBodySchema = z.object({
  actualScoreA: z.number().int().min(0),
  actualScoreB: z.number().int().min(0),
});

router.put("/admin/football/predictions/:id/resolve", requireAuth, async (req, res): Promise<void> => {
  if (req.user?.role !== "admin" && req.user?.role !== "editor") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const body = ResolvePredictionBodySchema.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const { actualScoreA, actualScoreB } = body.data;

  try {
    const [updated] = await db
      .update(footballPredictionRequestsTable)
      .set({
        actualScoreA,
        actualScoreB,
        status: "resolved",
        resolvedAt: new Date(),
      })
      .where(eq(footballPredictionRequestsTable.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: "Prediction not found" });
      return;
    }

    res.json({ item: updated });
    return;
  } catch (_err) {
    res.status(500).json({ error: "Failed to resolve prediction" });
    return;
  }
});

export default router;

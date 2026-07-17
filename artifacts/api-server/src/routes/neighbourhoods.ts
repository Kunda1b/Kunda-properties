import { Router } from "express";
import { db } from "@workspace/db";
import { neighbourhoodGuides } from "@workspace/db/schema";
import { eq, ilike } from "drizzle-orm";

const router = Router();

// ── GET /neighbourhoods ───────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const { region } = req.query;
    const where = region ? ilike(neighbourhoodGuides.region, `%${region}%`) : undefined;
    const guides = await db.query.neighbourhoodGuides.findMany({
      where: () => where,
      orderBy: (g, { asc }) => [asc(g.area)],
    });
    res.json({ success: true, data: guides });
  } catch (err) { next(err); }
});

// ── GET /neighbourhoods/:area ─────────────────────────────────────────────────
router.get("/:area", async (req, res, next) => {
  try {
    const [guide] = await db.select().from(neighbourhoodGuides)
      .where(ilike(neighbourhoodGuides.area, req.params.area)).limit(1);
    if (!guide) return res.status(404).json({ success: false, error: "Neighbourhood guide not found" });
    res.json({ success: true, data: guide });
  } catch (err) { next(err); }
});

export default router;

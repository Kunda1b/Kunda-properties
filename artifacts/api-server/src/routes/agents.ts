import { Router } from "express";
import { db } from "@workspace/db";
import { users, userProfiles, listings, listingImages } from "@workspace/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { AppError } from "../lib/errors.js";

const router = Router();

// ── GET /agents ───────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    // Do not expose email addresses on public agent directory
    const agents = await db.select({
      id: users.id,
      firstName: userProfiles.firstName,
      lastName: userProfiles.lastName,
      bio: userProfiles.bio,
      avatarUrl: userProfiles.avatarUrl,
      city: userProfiles.city,
      country: userProfiles.country,
      languages: userProfiles.languages,
      listingsCount: sql<number>`(SELECT COUNT(*) FROM listings WHERE seller_id = users.id AND status = 'ACTIVE')::int`,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(and(
      sql`${users.role} IN ('AGENT', 'SELLER')`,
      eq(users.isActive, true),
      eq(users.isSuspended, false),
    ))
    .orderBy(desc(sql`listings_count`));

    res.json({ success: true, data: agents });
  } catch (err) { next(err); }
});

// ── GET /agents/:id ───────────────────────────────────────────────────────────
router.get("/:id", async (req, res, next) => {
  try {
    const [agent] = await db.select({
      id: users.id,
      role: users.role,
      firstName: userProfiles.firstName,
      lastName: userProfiles.lastName,
      bio: userProfiles.bio,
      avatarUrl: userProfiles.avatarUrl,
      city: userProfiles.city,
      country: userProfiles.country,
      languages: userProfiles.languages,
      createdAt: users.createdAt,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .where(eq(users.id, req.params.id))
    .limit(1);

    if (!agent) throw new AppError("Agent not found", 404, "NOT_FOUND");

    const agentListings = await db.query.listings.findMany({
      where: (l, { eq: eqFn, and: andFn }) =>
        andFn(eqFn(l.sellerId, agent.id), eqFn(l.status, "ACTIVE")),
      with: {
        images: { where: (i: any, { eq: eqFn }: any) => eqFn(i.isPrimary, true), limit: 1 },
      },
      orderBy: (l, { desc: descFn }) => [descFn(l.createdAt)],
    });

    const [stats] = await db.execute(
      sql`SELECT
        COUNT(*)::int as total_listings,
        COALESCE(SUM(CASE WHEN status = 'SOLD' THEN 1 ELSE 0 END), 0)::int as sold_count,
        COALESCE(SUM(view_count), 0)::int as total_views
      FROM listings WHERE seller_id = ${agent.id}`
    );

    res.json({
      success: true,
      data: {
        agent,
        listings: agentListings,
        stats: {
          totalListings: Number(stats?.total_listings || 0),
          soldCount: Number(stats?.sold_count || 0),
          totalViews: Number(stats?.total_views || 0),
        },
      },
    });
  } catch (err) { next(err); }
});

export default router;

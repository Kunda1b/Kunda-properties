import { Router } from "express";
import { db } from "@workspace/db";
import { exchangeRates } from "@workspace/db/schema";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const rates = await db.select().from(exchangeRates);
    res.json({ success: true, data: rates });
  } catch (err) { next(err); }
});

export default router;

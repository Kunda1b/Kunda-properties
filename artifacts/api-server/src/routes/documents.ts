import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { documents } from "@workspace/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { documentsLimiter } from "../middleware/rateLimiters.js";
import { validateUpload } from "../lib/uploadValidation.js";
import { sanitizeText } from "../lib/sanitize.js";
import { writeAudit } from "../lib/audit.js";

const router = Router();
router.use(authenticate);

const DOC_TYPES = [
  "TITLE_DEED","SURVEY_PLAN","BUILDING_PERMIT","PURCHASE_AGREEMENT",
  "POWER_OF_ATTORNEY","IDENTITY_DOCUMENT","PROOF_OF_FUNDS",
  "INSPECTION_REPORT","TAX_CLEARANCE","OTHER",
] as const;

// ── GET /documents ────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { listingId } = req.query;

    const where = listingId
      ? and(eq(documents.uploadedById, userId), eq(documents.listingId, listingId as string))
      : eq(documents.uploadedById, userId);

    const results = await db.select().from(documents)
      .where(where)
      .orderBy(desc(documents.createdAt));

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
});

// ── POST /documents ───────────────────────────────────────────────────────────
router.post(
  "/",
  documentsLimiter,
  validate([
    body("type").isIn(DOC_TYPES),
    body("title").trim().isLength({ min: 1, max: 200 }),
    body("fileUrl").isURL({ protocols: ["http", "https"], require_protocol: true }),
    body("mimeType").optional().isString().isLength({ max: 100 }),
    body("fileSize").optional().isInt({ min: 1, max: 10 * 1024 * 1024 }),
    body("listingId").optional().isString().isLength({ max: 64 }),
  ]),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const type = req.body.type;
      const title = sanitizeText(req.body.title, 200);
      const listingId = req.body.listingId || null;

      const validated = validateUpload({
        fileUrl: req.body.fileUrl,
        mimeType: req.body.mimeType,
        fileSize: req.body.fileSize,
        kind: "document",
      });

      const [doc] = await db.insert(documents).values({
        type,
        title,
        fileUrl: validated.fileUrl,
        listingId,
        uploadedById: userId,
        status: "UPLOADED",
        mimeType: validated.mimeType,
        fileSize: validated.fileSize,
      }).returning();

      await writeAudit(req, {
        action: "DOCUMENT_UPLOAD",
        resource: "document",
        resourceId: doc.id,
        newValues: { type, mimeType: validated.mimeType, listingId },
      });

      res.status(201).json({ success: true, data: doc });
    } catch (err) { next(err); }
  },
);

// ── GET /documents/:id/url — return access URL (stub: passthrough) ────────────
router.get("/:id/url", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [doc] = await db.select().from(documents)
      .where(eq(documents.id, req.params.id)).limit(1);
    if (!doc) throw new AppError("Document not found", 404, "NOT_FOUND");
    if (doc.uploadedById !== userId && !doc.isPublic)
      throw new AppError("Access denied", 403, "FORBIDDEN");

    // Production: generate a signed S3/GCS URL here. Currently returning direct URL.
    res.json({ success: true, data: { url: doc.fileUrl, expiresIn: 3600 } });
  } catch (err) { next(err); }
});

// ── DELETE /documents/:id ─────────────────────────────────────────────────────
router.delete("/:id", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [doc] = await db.select().from(documents)
      .where(eq(documents.id, req.params.id)).limit(1);
    if (!doc) throw new AppError("Document not found", 404, "NOT_FOUND");
    if (doc.uploadedById !== userId)
      throw new AppError("Access denied", 403, "FORBIDDEN");

    await db.delete(documents).where(eq(documents.id, req.params.id));

    await writeAudit(req, {
      action: "DOCUMENT_DELETE",
      resource: "document",
      resourceId: req.params.id,
    });

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;

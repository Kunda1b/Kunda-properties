import { Router } from "express";
import { authenticate, requireRole } from "../middleware/authenticate";
import { prisma } from "@kunda/database";
const router = Router();
router.use(authenticate, requireRole("ADMIN"));

router.get("/documents/pending", async (req, res, next) => {
  try {
    const { status = "UPLOADED", limit = 50, search } = req.query;
    const where: any = { status };
    if (search) where.title = { contains: String(search), mode: "insensitive" };
    const documents = await prisma.document.findMany({ where, take: Number(limit), orderBy: { createdAt: "asc" }, include: { uploadedBy: { include: { profile: true } } } });
    res.json({ success: true, data: { documents } });
  } catch (e) { next(e); }
});

router.patch("/documents/:id/verify", async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    if (!["VERIFIED","REJECTED"].includes(status)) return res.status(400).json({ success: false, error: "Invalid status" });
    const doc = await prisma.document.update({
      where: { id: req.params.id },
      data: { status, verifiedAt: status === "VERIFIED" ? new Date() : undefined, verifiedById: (req as any).user.id, rejectionReason: reason },
    });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: status === "VERIFIED" ? "APPROVE" : "REJECT", resource: "document", resourceId: req.params.id } });
    return res.json({ success: true, data: doc });
  } catch (e) { next(e); }
});

export default router;

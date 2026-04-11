import multer from "multer";
import { Router, type Response } from "express";
import { documentsController } from "../controllers/documents.controller";
import { requireAuth, requireRole, type AuthRequest } from "../middleware/auth.middleware";
import { getSignedDownloadUrl } from "../utils/s3";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

router.get("/escrow/:escrowId", documentsController.findByEscrow);
router.get("/:id/download", documentsController.getDownloadUrl);
router.post("/:id/sign", documentsController.sign);

router.post(
  "/escrow/:escrowId/sale-agreement",
  requireRole("ADMIN"),
  documentsController.generateSaleAgreement,
);

router.post(
  "/escrow/:escrowId/title-deed",
  requireRole("ADMIN"),
  upload.single("document"),
  documentsController.uploadTitleDeed,
);

router.get(
  "/kyc/:userId/:type",
  requireRole("ADMIN"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { prisma } = await import("@kunda/db");
      const { userId, type } = req.params;

      const kyc = await prisma.kYCRecord.findUnique({
        where: { userId },
        select: { documentUrl: true, selfieUrl: true },
      });

      if (!kyc) {
        res.status(404).json({ success: false, error: "KYC record not found" });
        return;
      }

      const key = type === "selfie" ? kyc.selfieUrl : kyc.documentUrl;

      if (!key || key === "pending") {
        res.status(404).json({ success: false, error: "Document not uploaded" });
        return;
      }

      const url = await getSignedDownloadUrl(key, 900);
      res.status(200).json({ success: true, data: { url, expiresIn: 900 } });
    } catch {
      res.status(500).json({ success: false, error: "Failed to get document URL" });
    }
  },
);

export { router as documentsRoutes };

import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { kycController } from "../controllers/kyc.controller";
import { requireAuth, requireRole } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/login", authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.post("/resend-otp", authController.resendOTP);
router.get("/me", requireAuth, authController.me);
router.post("/kyc/submit", requireAuth, kycController.submit);
router.get("/kyc/status", requireAuth, kycController.getStatus);
router.get("/kyc/id-types", requireAuth, kycController.getSupportedIDTypes);
router.get("/kyc/queue", requireAuth, requireRole("ADMIN"), kycController.getPendingQueue);
router.post("/kyc/:userId/approve", requireAuth, requireRole("ADMIN"), kycController.adminApprove);
router.post("/kyc/:userId/reject", requireAuth, requireRole("ADMIN"), kycController.adminReject);

export { router as authRoutes };

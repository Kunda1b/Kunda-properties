import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { submitKyc, getKycStatus, uploadKycDocument, smileWebhook } from "../controllers/kyc.controller";

const router = Router();
router.get("/status", authenticate, getKycStatus);
router.post("/submit", authenticate, validate([
  body("idType").isIn(["PASSPORT","NATIONAL_ID","DRIVERS_LICENSE","VOTER_ID"]),
  body("idNumber").notEmpty().trim(),
  body("idCountry").isLength({ min: 2, max: 3 }),
  body("firstName").notEmpty().trim(),
  body("lastName").notEmpty().trim(),
  body("dateOfBirth").isISO8601(),
]), submitKyc);
router.post("/upload-document", authenticate, validate([
  body("imageUrl").isURL(), body("side").isIn(["front","back","selfie"]),
]), uploadKycDocument);
router.post("/webhook/smile", smileWebhook);

export default router;

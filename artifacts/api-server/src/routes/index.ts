import { Router } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import kycRouter from "./kyc.js";
import profileRouter from "./profile.js";
import listingsRouter from "./listings.js";
import searchRouter from "./search.js";
import savedRouter from "./saved.js";
import offersRouter from "./offers.js";
import escrowRouter from "./escrow.js";
import adminRouter from "./admin.js";

const router = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/kyc", kycRouter);
router.use("/profile", profileRouter);
router.use("/listings", listingsRouter);
router.use("/search", searchRouter);
router.use("/saved", savedRouter);
router.use("/offers", offersRouter);
router.use("/escrow", escrowRouter);
router.use("/admin", adminRouter);

export default router;

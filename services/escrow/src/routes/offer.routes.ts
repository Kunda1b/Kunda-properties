import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { makeOffer, respondToOffer, getMyOffers } from "../controllers/offer.controller";
const router = Router();
router.use(authenticate);
router.get("/my", getMyOffers);
router.post("/", makeOffer);
router.patch("/:offerId/respond", respondToOffer);
export default router;

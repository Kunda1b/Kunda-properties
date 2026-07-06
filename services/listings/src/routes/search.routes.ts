import { Router } from "express";
import { searchListings, getFeaturedListings, getSimilarListings, getMarketStats } from "../controllers/search.controller";
const router = Router();
router.get("/", searchListings);
router.get("/featured", getFeaturedListings);
router.get("/stats", getMarketStats);
router.get("/:id/similar", getSimilarListings);
export default router;

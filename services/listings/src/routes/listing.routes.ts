import { Router } from "express";
import { body } from "express-validator";
import { authenticate } from "../middleware/authenticate";
import { validate } from "../middleware/validate";
import { createListing, getListing, updateListing, deleteListing, getMyListings, submitForReview } from "../controllers/listing.controller";

const router = Router();
router.get("/:id", getListing);
router.use(authenticate);
router.get("/my/all", getMyListings);
router.post("/", validate([
  body("title").trim().isLength({ min: 10, max: 200 }),
  body("description").trim().isLength({ min: 50 }),
  body("propertyType").isIn(["HOUSE","APARTMENT","LAND","COMMERCIAL","VILLA","COMPOUND"]),
  body("price").isNumeric().isFloat({ min: 0 }),
  body("currency").isIn(["GMD","USD","GBP","EUR"]),
  body("address").trim().notEmpty(),
  body("region").trim().notEmpty(),
]), createListing);
router.patch("/:id", updateListing);
router.post("/:id/submit-review", submitForReview);
router.delete("/:id", deleteListing);

export default router;

import { Router } from "express";
import multer from "multer";
import { listingsController } from "../controllers/listings.controller";
import {
  requireAuth,
  requireKYC,
  requireRole,
} from "../middleware/auth.middleware";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.get("/", listingsController.search);
router.get(
  "/my",
  requireAuth,
  requireRole("AGENT"),
  listingsController.getMyListings,
);
router.get("/saved", requireAuth, listingsController.getSavedListings);
router.get(
  "/:id/upload-signature",
  requireAuth,
  requireRole("AGENT"),
  listingsController.getUploadSignature,
);
router.get("/:id", listingsController.findById);

router.post(
  "/",
  requireAuth,
  requireRole("AGENT"),
  requireKYC,
  listingsController.create,
);
router.patch(
  "/:id",
  requireAuth,
  requireRole("AGENT"),
  listingsController.update,
);
router.delete(
  "/:id",
  requireAuth,
  requireRole("AGENT"),
  listingsController.delete,
);

router.post(
  "/:id/publish",
  requireAuth,
  requireRole("ADMIN"),
  listingsController.publish,
);
router.post(
  "/:id/reject",
  requireAuth,
  requireRole("ADMIN"),
  listingsController.reject,
);

router.post(
  "/:id/photos",
  requireAuth,
  requireRole("AGENT"),
  upload.single("photo"),
  listingsController.addPhoto,
);

router.post(
  "/:id/photos/register",
  requireAuth,
  requireRole("AGENT"),
  listingsController.registerPhoto,
);
router.delete(
  "/:id/photos/:photoId",
  requireAuth,
  requireRole("AGENT"),
  listingsController.deletePhoto,
);
router.patch(
  "/:id/photos/reorder",
  requireAuth,
  requireRole("AGENT"),
  listingsController.reorderPhotos,
);
router.patch(
  "/:id/photos/:photoId/set-primary",
  requireAuth,
  requireRole("AGENT"),
  listingsController.setPrimaryPhoto,
);

router.post("/:id/save", requireAuth, listingsController.saveListing);
router.delete("/:id/save", requireAuth, listingsController.unsaveListing);

export { router as listingsRoutes };

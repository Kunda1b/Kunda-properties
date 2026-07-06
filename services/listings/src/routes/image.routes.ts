import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { uploadImages, deleteImage, setPrimaryImage, reorderImages } from "../controllers/image.controller";
const router = Router();
router.post("/:id/images", authenticate, uploadImages);
router.delete("/:id/images/:imageId", authenticate, deleteImage);
router.patch("/:id/images/:imageId/primary", authenticate, setPrimaryImage);
router.patch("/:id/images/reorder", authenticate, reorderImages);
export default router;

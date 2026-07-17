import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { sendNotification, notifyEscrow, getUserNotifications, markAsRead } from "../controllers/notification.controller";
const router = Router();
router.post("/escrow", notifyEscrow);   // internal service-to-service call
router.post("/send", sendNotification); // internal service-to-service call
router.use(authenticate);
router.get("/", getUserNotifications);
router.patch("/read", markAsRead);
export default router;

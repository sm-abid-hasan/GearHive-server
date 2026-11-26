import { Router } from "express";
import { verifyToken, verifyAdmin, verifyOwner, verifyRenter } from "../middlewares/auth.js";
import { adminAnalytics, ownerAnalytics, customerAnalytics } from "../controllers/analytics.controller.js";

const router = Router();

router.get("/admin", verifyToken, verifyAdmin, adminAnalytics);
router.get("/owner", verifyToken, verifyOwner, ownerAnalytics);
router.get("/customer", verifyToken, verifyRenter, customerAnalytics);

export default router;

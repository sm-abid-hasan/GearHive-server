
import { Router } from "express";
import equipmentRoutes from "./equipment.routes.js";
import favoritesRoutes from "./favorites.routes.js";
import bookingsRoutes from "./bookings.routes.js";
import paymentsRoutes from "./payments.routes.js";
import ownerRoutes from "./owner.routes.js";
import adminRoutes from "./admin.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = Router();

router.use("/equipment", equipmentRoutes);
router.use("/favorites", favoritesRoutes);
router.use("/bookings", bookingsRoutes);
router.use("/payments", paymentsRoutes);
router.use("/owner", ownerRoutes);
router.use("/admin", adminRoutes);
router.use("/analytics", analyticsRoutes);

export default router;

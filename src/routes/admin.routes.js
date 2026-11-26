import { Router } from "express";
import { verifyToken, verifyAdmin } from "../middlewares/auth.js";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getAllEquipmentForAdmin,
  updateEquipmentStatus,
  getAllRentals,
  updateRentalStatus,
  syncRentalStatuses,
} from "../controllers/admin.controller.js";

const router = Router();


router.use(verifyToken, verifyAdmin);


router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);


router.get("/equipment", getAllEquipmentForAdmin);
router.patch("/equipment/:id/status", updateEquipmentStatus);


router.get("/rentals", getAllRentals);
router.patch("/rentals/:id/status", updateRentalStatus);
router.post("/rentals/sync", syncRentalStatuses); 

export default router;

import { Router } from "express";
import { verifyToken, verifyOwner } from "../middlewares/auth.js";
import { getMyEquipment, getMyEquipmentRentals } from "../controllers/owner.controller.js";

const router = Router();


router.use(verifyToken, verifyOwner);

router.get("/equipment", getMyEquipment);
router.get("/rentals", getMyEquipmentRentals);

export default router;

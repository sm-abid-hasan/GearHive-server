import { Router } from "express";
import { verifyToken, verifyOwner } from "../middlewares/auth.js";
import {
  getAllEquipment,
  getFeaturedEquipment,
  getRecentEquipment,
  getCategoryCounts,
  getEquipmentById,
  checkAvailability,
  createEquipment,
  updateEquipment,
  deleteEquipment,
} from "../controllers/equipment.controller.js";

const router = Router();


router.get("/", getAllEquipment);
router.get("/featured", getFeaturedEquipment);
router.get("/recent", getRecentEquipment);
router.get("/categories", getCategoryCounts);


router.get("/:id", verifyToken, getEquipmentById);
router.get("/:id/availability", verifyToken, checkAvailability);
router.post("/", verifyToken, verifyOwner, createEquipment);
router.put("/:id", verifyToken, updateEquipment); 
router.delete("/:id", verifyToken, deleteEquipment); 

export default router;

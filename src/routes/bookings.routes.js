import { Router } from "express";
import { verifyToken, verifyRenter } from "../middlewares/auth.js";
import { createBooking, getMyBookings, getBookingById } from "../controllers/bookings.controller.js";

const router = Router();

router.post("/", verifyToken, verifyRenter, createBooking);
router.get("/my", verifyToken, verifyRenter, getMyBookings); 
router.get("/:id", verifyToken, getBookingById); 

export default router;

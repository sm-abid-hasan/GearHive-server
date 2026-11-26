import { Router } from "express";
import { verifyToken, verifyRenter } from "../middlewares/auth.js";
import { getMyFavorites, checkFavorite, addFavorite, removeFavorite } from "../controllers/favorites.controller.js";

const router = Router();


router.use(verifyToken, verifyRenter);

router.get("/", getMyFavorites);
router.get("/check/:equipmentId", checkFavorite);
router.post("/", addFavorite);
router.delete("/:equipmentId", removeFavorite);

export default router;

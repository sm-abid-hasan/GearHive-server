import { collections } from "../config/db.js";
import { EQUIPMENT_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";


export const getMyFavorites = asyncHandler(async (req, res) => {
  const rows = await collections.favorites
    .aggregate([
      { $match: { userEmail: req.user.email } },
      { $sort: { createdAt: -1 } },

      {
        $lookup: {
          from: "equipment",
          localField: "equipmentId",
          foreignField: "_id",
          as: "equipment",
        },
      },
      { $unwind: "$equipment" }, 
    ])
    .toArray();

  res.json(rows.map((row) => ({ ...row.equipment, favoritedAt: row.createdAt })));
});


export const checkFavorite = asyncHandler(async (req, res) => {
  const equipmentId = toObjectId(req.params.equipmentId, "equipment id");
  const found = await collections.favorites.findOne({ userEmail: req.user.email, equipmentId });
  res.json({ isFavorite: Boolean(found) });
});


export const addFavorite = asyncHandler(async (req, res) => {
  const equipmentId = toObjectId(req.body.equipmentId, "equipment id");

  const equipment = await collections.equipment.findOne({ _id: equipmentId });
  if (!equipment || equipment.status !== EQUIPMENT_STATUS.APPROVED) {
    throw new HttpError(404, "Equipment not found");
  }


  await collections.favorites.updateOne(
    { userEmail: req.user.email, equipmentId },
    { $setOnInsert: { userEmail: req.user.email, equipmentId, createdAt: new Date() } },
    { upsert: true }
  );

  res.status(201).json({ message: "Added to favorites" });
});


export const removeFavorite = asyncHandler(async (req, res) => {
  const equipmentId = toObjectId(req.params.equipmentId, "equipment id");
  await collections.favorites.deleteOne({ userEmail: req.user.email, equipmentId });
  res.json({ message: "Removed from favorites" });
});

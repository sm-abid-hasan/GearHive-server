import { collections } from "../config/db.js";
import { BOOKING_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const getMyEquipment = asyncHandler(async (req, res) => {
  const items = await collections.equipment
    .find({ "owner.email": req.user.email })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(items);
});


export const getMyEquipmentRentals = asyncHandler(async (req, res) => {
  const items = await collections.bookings
    .find({
      ownerEmail: req.user.email,
      bookingStatus: { $ne: BOOKING_STATUS.AWAITING_PAYMENT }, 
    })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(items);
});

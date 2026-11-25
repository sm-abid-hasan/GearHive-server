import { collections } from "../config/db.js";
import { BOOKING_STATUS, PAYMENT_HOLD_MINUTES } from "../config/constants.js";


export async function getBookedQuantity(equipmentId, startDate, endDate, excludeBookingId = null) {
  const holdCutoff = new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60 * 1000);

  const match = {
    equipmentId,
    startDate: { $lte: endDate },
    endDate: { $gte: startDate },
    $or: [
      { bookingStatus: BOOKING_STATUS.CONFIRMED },
      { bookingStatus: BOOKING_STATUS.AWAITING_PAYMENT, createdAt: { $gte: holdCutoff } },
    ],
  };
  if (excludeBookingId) match._id = { $ne: excludeBookingId };

  const result = await collections.bookings
    .aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: "$quantity" } } }])
    .toArray();

  return result[0]?.total || 0;
}


export async function getRemainingQuantity(equipment, startDate, endDate, excludeBookingId = null) {
  const booked = await getBookedQuantity(equipment._id, startDate, endDate, excludeBookingId);
  return Math.max(0, equipment.availableQuantity - booked);
}

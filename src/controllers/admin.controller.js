import { collections, getDb } from "../config/db.js";
import {
  ROLE_LIST,
  EQUIPMENT_STATUS_LIST,
  ADMIN_BOOKING_STATUSES,
  BOOKING_STATUS,
} from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";
import { sendBookingCompletedEmails } from "../services/email.service.js";
import { completeFinishedBookings } from "../jobs/bookingStatus.job.js";




export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await collections.users
    .find({}, { projection: { name: 1, email: 1, image: 1, role: 1, isBlocked: 1, createdAt: 1 } })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();

  res.json(
    users.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image || "",
      role: user.role || "customer",
      isBlocked: Boolean(user.isBlocked),
      createdAt: user.createdAt,
    }))
  );
});


async function findOtherUser(req) {
  const userId = toObjectId(req.params.id, "user id");
  const user = await collections.users.findOne({ _id: userId });
  if (!user) throw new HttpError(404, "User not found");
  if (user.email === req.user.email) throw new HttpError(400, "You can not change your own account here");
  return user;
}


export const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!ROLE_LIST.includes(role)) {
    throw new HttpError(400, `Role must be one of: ${ROLE_LIST.join(", ")}`);
  }

  const user = await findOtherUser(req);
  await collections.users.updateOne({ _id: user._id }, { $set: { role, updatedAt: new Date() } });

  res.json({ message: `${user.name} is now ${role}` });
});


export const updateUserStatus = asyncHandler(async (req, res) => {
  if (typeof req.body.isBlocked !== "boolean") {
    throw new HttpError(400, "isBlocked must be true or false");
  }

  const user = await findOtherUser(req);
  await collections.users.updateOne(
    { _id: user._id },
    { $set: { isBlocked: req.body.isBlocked, updatedAt: new Date() } }
  );

  res.json({ message: req.body.isBlocked ? `${user.name} has been blocked` : `${user.name} has been unblocked` });
});


export const deleteUser = asyncHandler(async (req, res) => {
  const user = await findOtherUser(req);


  const db = getDb();
  const idValues = [String(user._id), user._id];
  await db.collection("session").deleteMany({ userId: { $in: idValues } });
  await db.collection("account").deleteMany({ userId: { $in: idValues } });

  await collections.favorites.deleteMany({ userEmail: user.email });
  await collections.users.deleteOne({ _id: user._id });

  res.json({ message: `${user.name} has been deleted` });
});


export const getAllEquipmentForAdmin = asyncHandler(async (req, res) => {
  const items = await collections.equipment.find({}).sort({ createdAt: -1 }).toArray();
  res.json(items);
});


export const updateEquipmentStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!EQUIPMENT_STATUS_LIST.includes(status)) {
    throw new HttpError(400, `Status must be one of: ${EQUIPMENT_STATUS_LIST.join(", ")}`);
  }

  const result = await collections.equipment.updateOne(
    { _id: toObjectId(req.params.id, "equipment id") },
    { $set: { status, updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) throw new HttpError(404, "Equipment not found");

  res.json({ message: `Equipment ${status}` });
});

export const getAllRentals = asyncHandler(async (req, res) => {
  const items = await collections.bookings
    .find({ bookingStatus: { $ne: BOOKING_STATUS.AWAITING_PAYMENT } })
    .sort({ createdAt: -1 })
    .limit(1000)
    .toArray();

  res.json(items);
});


export const updateRentalStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!ADMIN_BOOKING_STATUSES.includes(status)) {
    throw new HttpError(400, `Status must be one of: ${ADMIN_BOOKING_STATUSES.join(", ")}`);
  }

  const booking = await collections.bookings.findOne({ _id: toObjectId(req.params.id, "booking id") });
  if (!booking) throw new HttpError(404, "Rental not found");
  if (booking.bookingStatus === BOOKING_STATUS.AWAITING_PAYMENT) {
    throw new HttpError(400, "This booking has not been paid yet");
  }

  await collections.bookings.updateOne({ _id: booking._id }, { $set: { bookingStatus: status, updatedAt: new Date() } });


  if (status === BOOKING_STATUS.COMPLETED && booking.bookingStatus !== BOOKING_STATUS.COMPLETED) {
    sendBookingCompletedEmails(booking);
  }

  res.json({ message: `Rental marked as ${status}` });
});


export const syncRentalStatuses = asyncHandler(async (req, res) => {
  const count = await completeFinishedBookings();
  res.json({ message: `${count} finished rental(s) marked as completed`, count });
});

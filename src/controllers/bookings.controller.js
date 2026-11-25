import { collections } from "../config/db.js";
import { ROLES, EQUIPMENT_STATUS, BOOKING_STATUS, PAYMENT_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";
import { getPagination, buildPageMeta } from "../utils/pagination.js";
import { parseDate, todayUTC, countRentalDays, calculateTotal } from "../services/pricing.service.js";
import { getRemainingQuantity } from "../services/availability.service.js";

const PHONE_PATTERN = /^\+?[0-9\s-]{7,20}$/;


export const createBooking = asyncHandler(async (req, res) => {
  const { equipmentId, startDate, endDate, quantity, contactNumber, deliveryAddress, notes } = req.body;

  const equipment = await collections.equipment.findOne({ _id: toObjectId(equipmentId, "equipment id") });
  if (!equipment || equipment.status !== EQUIPMENT_STATUS.APPROVED) {
    throw new HttpError(404, "Equipment not found");
  }


  const start = parseDate(startDate);
  const end = parseDate(endDate);
  if (!start || !end) throw new HttpError(400, "Please choose a valid start date and end date");
  // One day of grace, because the customer's local "today" can differ from UTC "today".
  const earliestStart = new Date(todayUTC().getTime() - 24 * 60 * 60 * 1000);
  if (start < earliestStart) throw new HttpError(400, "Rental start date can not be in the past");
  if (end < start) throw new HttpError(400, "Rental end date must be on or after the start date");

  const requiredQuantity = Number(quantity);
  if (!Number.isInteger(requiredQuantity) || requiredQuantity < 1) {
    throw new HttpError(400, "Required quantity must be a whole number of at least 1");
  }

  const phone = typeof contactNumber === "string" ? contactNumber.trim() : "";
  if (!PHONE_PATTERN.test(phone)) throw new HttpError(400, "Please enter a valid contact number");

  const address = typeof deliveryAddress === "string" ? deliveryAddress.trim() : "";
  if (address.length < 5) throw new HttpError(400, "Please enter your delivery address");

  const extraNotes = typeof notes === "string" ? notes.trim().slice(0, 500) : "";


  const remaining = await getRemainingQuantity(equipment, start, end);
  if (requiredQuantity > remaining) {
    throw new HttpError(
      409,
      remaining === 0
        ? "This equipment is not available on the selected dates"
        : `Only ${remaining} unit(s) are available on the selected dates`
    );
  }


  const totalDays = countRentalDays(start, end);
  const totalAmount = calculateTotal({
    price: equipment.price,
    rentalType: equipment.rentalType,
    days: totalDays,
    quantity: requiredQuantity,
  });

  const now = new Date();
  const booking = {
    equipmentId: equipment._id,
    equipmentName: equipment.name,
    equipmentImage: equipment.image,
    category: equipment.category,
    rentalType: equipment.rentalType,
    unitPrice: equipment.price,

    ownerName: equipment.owner.name,
    ownerEmail: equipment.owner.email,

    customerName: req.user.name,
    customerEmail: req.user.email,
    contactNumber: phone,
    deliveryAddress: address,
    notes: extraNotes,

    startDate: start,
    endDate: end,
    totalDays,
    quantity: requiredQuantity,
    totalAmount,

    paymentStatus: PAYMENT_STATUS.UNPAID,
    bookingStatus: BOOKING_STATUS.AWAITING_PAYMENT,
    transactionId: null,

    createdAt: now,
    updatedAt: now,
  };

  const result = await collections.bookings.insertOne(booking);

  res.status(201).json({
    message: "Booking created. Please complete the payment.",
    bookingId: result.insertedId,
    totalAmount,
    totalDays,
  });
});


export const getMyBookings = asyncHandler(async (req, res) => {
  const filter = {
    customerEmail: req.user.email,
    bookingStatus: { $ne: BOOKING_STATUS.AWAITING_PAYMENT },
  };

  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 8, maxLimit: 50 });

  const [items, total] = await Promise.all([
    collections.bookings.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collections.bookings.countDocuments(filter),
  ]);

  res.json({ items, ...buildPageMeta(total, page, limit) });
});


export const getBookingById = asyncHandler(async (req, res) => {
  const booking = await collections.bookings.findOne({ _id: toObjectId(req.params.id, "booking id") });
  if (!booking) throw new HttpError(404, "Booking not found");

  const isAdmin = req.user.role === ROLES.ADMIN;
  if (!isAdmin && booking.customerEmail !== req.user.email) {
    throw new HttpError(403, "Forbidden: this is not your booking");
  }

  res.json(booking);
});

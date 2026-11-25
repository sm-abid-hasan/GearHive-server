import { collections } from "../config/db.js";
import { ROLES, EQUIPMENT_STATUS, BOOKING_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";
import { escapeRegex } from "../utils/escapeRegex.js";
import { getPagination, buildPageMeta } from "../utils/pagination.js";
import { validateEquipmentPayload } from "../validators/equipment.validator.js";
import { parseDate, todayUTC } from "../services/pricing.service.js";
import { getRemainingQuantity } from "../services/availability.service.js";


const asText = (value) => (typeof value === "string" ? value.trim() : "");


export const getAllEquipment = asyncHandler(async (req, res) => {
  const q = asText(req.query.q);
  const category = asText(req.query.category);
  const rentalType = asText(req.query.rentalType);
  const minPrice = asText(req.query.minPrice);
  const maxPrice = asText(req.query.maxPrice);
  const availability = asText(req.query.availability);
  const sort = asText(req.query.sort);


  const filter = { status: EQUIPMENT_STATUS.APPROVED };

  if (q) {
    const regex = new RegExp(escapeRegex(q), "i"); 
    filter.$or = [{ name: regex }, { location: regex }, { category: regex }];
  }

  if (category && category !== "all") filter.category = category;
  if (rentalType && rentalType !== "all") filter.rentalType = rentalType;

  const priceFilter = {};
  if (minPrice !== "" && Number.isFinite(Number(minPrice))) priceFilter.$gte = Number(minPrice);
  if (maxPrice !== "" && Number.isFinite(Number(maxPrice))) priceFilter.$lte = Number(maxPrice);
  if (Object.keys(priceFilter).length > 0) filter.price = priceFilter;

  if (availability === "available") filter.availableQuantity = { $gt: 0 };
  if (availability === "unavailable") filter.availableQuantity = { $lte: 0 };

  const sortOptions = {
    price_asc: { price: 1, _id: 1 },
    price_desc: { price: -1, _id: 1 },
    newest: { createdAt: -1, _id: 1 },
  };
  const sortBy = sortOptions[sort] || sortOptions.newest;

  const { page, limit, skip } = getPagination(req.query, { defaultLimit: 9, maxLimit: 50 });

  const [items, total] = await Promise.all([
    collections.equipment.find(filter).sort(sortBy).skip(skip).limit(limit).toArray(),
    collections.equipment.countDocuments(filter),
  ]);

  res.json({ items, ...buildPageMeta(total, page, limit) });
});


export const getFeaturedEquipment = asyncHandler(async (req, res) => {
  const items = await collections.equipment
    .aggregate([
      { $match: { status: EQUIPMENT_STATUS.APPROVED } },
      { $sort: { featured: -1, createdAt: -1 } },
      { $limit: 6 },
    ])
    .toArray();

  res.json(items);
});

export const getRecentEquipment = asyncHandler(async (req, res) => {
  const limit = Math.min(12, Math.max(1, parseInt(req.query.limit, 10) || 4));

  const items = await collections.equipment
    .aggregate([
      { $match: { status: EQUIPMENT_STATUS.APPROVED } },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
    ])
    .toArray();

  res.json(items);
});


export const getCategoryCounts = asyncHandler(async (req, res) => {
  const rows = await collections.equipment
    .aggregate([
      { $match: { status: EQUIPMENT_STATUS.APPROVED } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ])
    .toArray();

  res.json(rows.map((row) => ({ category: row._id, count: row.count })));
});


export const getEquipmentById = asyncHandler(async (req, res) => {
  const equipment = await collections.equipment.findOne({ _id: toObjectId(req.params.id, "equipment id") });

  if (!equipment) throw new HttpError(404, "Equipment not found");


  const canSeeUnapproved = req.user.role === ROLES.ADMIN || equipment.owner?.email === req.user.email;
  if (equipment.status !== EQUIPMENT_STATUS.APPROVED && !canSeeUnapproved) {
    throw new HttpError(404, "Equipment not found");
  }

  res.json(equipment);
});


export const checkAvailability = asyncHandler(async (req, res) => {
  const equipment = await collections.equipment.findOne({ _id: toObjectId(req.params.id, "equipment id") });
  if (!equipment || equipment.status !== EQUIPMENT_STATUS.APPROVED) {
    throw new HttpError(404, "Equipment not found");
  }

  const startDate = parseDate(asText(req.query.startDate));
  const endDate = parseDate(asText(req.query.endDate));

  if (!startDate || !endDate || endDate < startDate) {
    throw new HttpError(400, "Please choose a valid start date and end date");
  }

  const remaining = await getRemainingQuantity(equipment, startDate, endDate);
  res.json({ totalQuantity: equipment.availableQuantity, remainingQuantity: remaining });
});


export const createEquipment = asyncHandler(async (req, res) => {
  const { errors, data } = validateEquipmentPayload(req.body, { minQuantity: 1 });
  if (errors.length > 0) throw new HttpError(400, errors.join(". "));

  const now = new Date();
  const document = {
    ...data,
    status: EQUIPMENT_STATUS.PENDING,
    featured: false,
  
    owner: {
      name: req.user.name,
      email: req.user.email,
      image: req.user.image,
      phone: req.user.phone,
    },
    createdAt: now,
    updatedAt: now,
  };

  const result = await collections.equipment.insertOne(document);
  res.status(201).json({ message: "Equipment added. It will appear after admin approval.", insertedId: result.insertedId });
});


async function findEditableEquipment(req) {
  const equipment = await collections.equipment.findOne({ _id: toObjectId(req.params.id, "equipment id") });
  if (!equipment) throw new HttpError(404, "Equipment not found");

  const isAdmin = req.user.role === ROLES.ADMIN;
  const isOwner = req.user.role === ROLES.OWNER && equipment.owner?.email === req.user.email;
  if (!isAdmin && !isOwner) {
    throw new HttpError(403, "Forbidden: you can only manage your own equipment");
  }

  return equipment;
}


export const updateEquipment = asyncHandler(async (req, res) => {
  const equipment = await findEditableEquipment(req);

  const { errors, data } = validateEquipmentPayload(req.body, { minQuantity: 0 });
  if (errors.length > 0) throw new HttpError(400, errors.join(". "));


  await collections.equipment.updateOne({ _id: equipment._id }, { $set: { ...data, updatedAt: new Date() } });

  res.json({ message: "Equipment updated successfully" });
});


export const deleteEquipment = asyncHandler(async (req, res) => {
  const equipment = await findEditableEquipment(req);


  const activeBookings = await collections.bookings.countDocuments({
    equipmentId: equipment._id,
    bookingStatus: BOOKING_STATUS.CONFIRMED,
    endDate: { $gte: todayUTC() },
  });

  if (activeBookings > 0) {
    throw new HttpError(409, "This equipment has active rentals, so it can not be deleted right now");
  }

  await collections.equipment.deleteOne({ _id: equipment._id });
  await collections.favorites.deleteMany({ equipmentId: equipment._id });

  res.json({ message: "Equipment deleted successfully" });
});

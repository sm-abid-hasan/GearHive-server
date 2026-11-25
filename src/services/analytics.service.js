
import { collections } from "../config/db.js";
import { BOOKING_STATUS, EQUIPMENT_STATUS } from "../config/constants.js";
import { getLastMonths, getStartOfMonths, monthKeyExpression } from "../utils/months.js";

const MONTHS_TO_SHOW = 6;
const round2 = (number) => Math.round((number || 0) * 100) / 100;


const REAL_BOOKINGS = { bookingStatus: { $ne: BOOKING_STATUS.AWAITING_PAYMENT } };


async function sumPayments(match = {}) {
  const rows = await collections.payments
    .aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: "$amount" } } }])
    .toArray();
  return round2(rows[0]?.total);
}


async function groupByMonth(collection, match, dateField, amountField = null) {
  const rows = await collection
    .aggregate([
      { $match: { ...match, [dateField]: { $gte: getStartOfMonths(MONTHS_TO_SHOW) } } },
      {
        $group: {
          _id: monthKeyExpression(`$${dateField}`),
          count: { $sum: 1 },
          amount: { $sum: amountField ? `$${amountField}` : 0 },
        },
      },
    ])
    .toArray();

  return new Map(rows.map((row) => [row._id, { count: row.count, amount: row.amount }]));
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);


export async function getAdminAnalytics() {
  const months = getLastMonths(MONTHS_TO_SHOW);

  const [
    totalUsers,
    totalEquipment,
    totalBookings,
    pendingApprovals,
    completedRentals,
    totalRevenue,
    bookingsByMonth,
    revenueByMonth,
    roleRows,
    statusRows,
  ] = await Promise.all([
    collections.users.countDocuments({}),
    collections.equipment.countDocuments({}),
    collections.bookings.countDocuments(REAL_BOOKINGS),
    collections.equipment.countDocuments({ status: EQUIPMENT_STATUS.PENDING }),
    collections.bookings.countDocuments({ bookingStatus: BOOKING_STATUS.COMPLETED }),
    sumPayments(),
    groupByMonth(collections.bookings, REAL_BOOKINGS, "createdAt"),
    groupByMonth(collections.payments, {}, "createdAt", "amount"),
    collections.users.aggregate([{ $group: { _id: { $ifNull: ["$role", "customer"] }, count: { $sum: 1 } } }]).toArray(),
    collections.equipment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]).toArray(),
  ]);

  return {
    totals: { totalUsers, totalEquipment, totalBookings, pendingApprovals, completedRentals, totalRevenue },
    monthly: months.map((month) => ({
      month: month.label,
      bookings: bookingsByMonth.get(month.key)?.count || 0,
      revenue: round2(revenueByMonth.get(month.key)?.amount),
    })),
    usersByRole: roleRows.map((row) => ({ name: capitalize(row._id), value: row.count })),
    equipmentByStatus: statusRows.map((row) => ({ name: capitalize(row._id), value: row.count })),
  };
}


export async function getOwnerAnalytics(ownerEmail) {
  const months = getLastMonths(MONTHS_TO_SHOW);

  const [totalListed, approvedEquipment, pendingEquipment, totalBookings, completedRentals, totalEarnings, bookingsByMonth, earningsByMonth] =
    await Promise.all([
      collections.equipment.countDocuments({ "owner.email": ownerEmail }),
      collections.equipment.countDocuments({ "owner.email": ownerEmail, status: EQUIPMENT_STATUS.APPROVED }),
      collections.equipment.countDocuments({ "owner.email": ownerEmail, status: EQUIPMENT_STATUS.PENDING }),
      collections.bookings.countDocuments({ ownerEmail, ...REAL_BOOKINGS }),
      collections.bookings.countDocuments({ ownerEmail, bookingStatus: BOOKING_STATUS.COMPLETED }),
      sumPayments({ ownerEmail }),
      groupByMonth(collections.bookings, { ownerEmail, ...REAL_BOOKINGS }, "createdAt"),
      groupByMonth(collections.payments, { ownerEmail }, "createdAt", "amount"),
    ]);

  return {
    totals: { totalListed, approvedEquipment, pendingEquipment, totalBookings, completedRentals, totalEarnings },
    monthly: months.map((month) => ({
      month: month.label,
      bookings: bookingsByMonth.get(month.key)?.count || 0,
      earnings: round2(earningsByMonth.get(month.key)?.amount),
    })),
  };
}


export async function getCustomerAnalytics(customerEmail) {
  const months = getLastMonths(MONTHS_TO_SHOW);

  const [totalRentals, activeRentals, completedRentals, favorites, totalSpent, spendingByMonth] = await Promise.all([
    collections.bookings.countDocuments({ customerEmail, ...REAL_BOOKINGS }),
    collections.bookings.countDocuments({ customerEmail, bookingStatus: BOOKING_STATUS.CONFIRMED }),
    collections.bookings.countDocuments({ customerEmail, bookingStatus: BOOKING_STATUS.COMPLETED }),
    collections.favorites.countDocuments({ userEmail: customerEmail }),
    sumPayments({ customerEmail }),
    groupByMonth(collections.payments, { customerEmail }, "createdAt", "amount"),
  ]);

  return {
    totals: { totalRentals, activeRentals, completedRentals, favorites, totalSpent },
    monthly: months.map((month) => ({
      month: month.label,
      spent: round2(spendingByMonth.get(month.key)?.amount),
    })),
  };
}

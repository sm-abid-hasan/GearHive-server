

export const ROLES = {
  CUSTOMER: "customer",
  OWNER: "owner",
  ADMIN: "admin",
};

export const ROLE_LIST = Object.values(ROLES);

export const CATEGORIES = [
  "Construction Equipment",
  "Photography Equipment",
  "Vehicles & Transportation",
  "Agriculture Equipment",
  "Electronics",
  "Event Equipment",
];

export const RENTAL_TYPES = ["Daily", "Weekly", "Monthly"];

export const CONDITIONS = ["New", "Like New", "Good", "Fair"];

export const EQUIPMENT_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const EQUIPMENT_STATUS_LIST = Object.values(EQUIPMENT_STATUS);

export const BOOKING_STATUS = {
  AWAITING_PAYMENT: "awaiting_payment",
  CONFIRMED: "confirmed", 
  COMPLETED: "completed", 
  CANCELLED: "cancelled",
};

export const PAYMENT_STATUS = {
  UNPAID: "unpaid",
  PAID: "paid",
};


export const ADMIN_BOOKING_STATUSES = [
  BOOKING_STATUS.CONFIRMED,
  BOOKING_STATUS.COMPLETED,
  BOOKING_STATUS.CANCELLED,
];


export const PAYMENT_HOLD_MINUTES = 30;

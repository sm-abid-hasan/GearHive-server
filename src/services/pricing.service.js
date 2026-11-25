

const MS_PER_DAY = 24 * 60 * 60 * 1000;


const PERIOD_DAYS = {
  Daily: 1,
  Weekly: 7,
  Monthly: 30,
};


export function parseDate(text) {
  if (typeof text !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  if (date.toISOString().slice(0, 10) !== text) return null;
  return date;
}


export function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}


export function countRentalDays(startDate, endDate) {
  return Math.round((endDate.getTime() - startDate.getTime()) / MS_PER_DAY) + 1;
}

const round2 = (number) => Math.round(number * 100) / 100;


export function calculateTotal({ price, rentalType, days, quantity }) {
  const periodDays = PERIOD_DAYS[rentalType] || 1;
  const periods = Math.ceil(days / periodDays);
  return round2(Number(price) * periods * Number(quantity));
}

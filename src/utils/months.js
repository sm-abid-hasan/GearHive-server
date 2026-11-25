
export function getLastMonths(count = 6) {
  const now = new Date();
  const months = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    months.push({ key, label });
  }

  return months;
}


export function getStartOfMonths(count = 6) {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1), 1));
}


export const monthKeyExpression = (field) => ({
  $dateToString: { format: "%Y-%m", date: field },
});

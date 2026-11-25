
import assert from "node:assert/strict";
import { parseDate, countRentalDays, calculateTotal } from "../src/services/pricing.service.js";
import { getPagination, buildPageMeta } from "../src/utils/pagination.js";
import { escapeRegex } from "../src/utils/escapeRegex.js";
import { getLastMonths } from "../src/utils/months.js";


assert.equal(parseDate("2026-12-25").toISOString(), "2026-12-25T00:00:00.000Z");
assert.equal(parseDate("2026-02-31"), null);
assert.equal(parseDate("25/12/2026"), null);
assert.equal(parseDate(undefined), null);


const jan5 = parseDate("2026-01-05");
const jan7 = parseDate("2026-01-07");
assert.equal(countRentalDays(jan5, jan5), 1);
assert.equal(countRentalDays(jan5, jan7), 3);


assert.equal(calculateTotal({ price: 50, rentalType: "Daily", days: 3, quantity: 2 }), 300);
assert.equal(calculateTotal({ price: 200, rentalType: "Weekly", days: 8, quantity: 1 }), 400); // 2 weeks
assert.equal(calculateTotal({ price: 500, rentalType: "Monthly", days: 30, quantity: 1 }), 500);
assert.equal(calculateTotal({ price: 500, rentalType: "Monthly", days: 31, quantity: 1 }), 1000);
assert.equal(calculateTotal({ price: 19.99, rentalType: "Daily", days: 3, quantity: 1 }), 59.97);


assert.deepEqual(getPagination({ page: "3", limit: "9" }), { page: 3, limit: 9, skip: 18 });
assert.deepEqual(getPagination({}), { page: 1, limit: 10, skip: 0 });
assert.equal(getPagination({ limit: "9999" }).limit, 50);
assert.equal(buildPageMeta(19, 1, 9).totalPages, 3);


assert.equal(escapeRegex("a+b(c)"), "a\\+b\\(c\\)");


assert.equal(getLastMonths(6).length, 6);

console.log("All logic checks passed ✔");

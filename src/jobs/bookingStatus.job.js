
import cron from "node-cron";
import { collections } from "../config/db.js";
import { env } from "../config/env.js";
import { BOOKING_STATUS } from "../config/constants.js";
import { todayUTC } from "../services/pricing.service.js";
import { sendBookingCompletedEmails } from "../services/email.service.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;


export async function completeFinishedBookings() {
  const finished = await collections.bookings
    .find({ bookingStatus: BOOKING_STATUS.CONFIRMED, endDate: { $lt: todayUTC() } })
    .toArray();

  if (finished.length > 0) {
    const now = new Date();
    await collections.bookings.updateMany(
      { _id: { $in: finished.map((booking) => booking._id) } },
      { $set: { bookingStatus: BOOKING_STATUS.COMPLETED, completedAt: now, updatedAt: now } }
    );

    for (const booking of finished) {
      await sendBookingCompletedEmails(booking);
    }
  }


  await collections.bookings.deleteMany({
    bookingStatus: BOOKING_STATUS.AWAITING_PAYMENT,
    createdAt: { $lt: new Date(Date.now() - ONE_DAY_MS) },
  });

  return finished.length;
}


export function startBookingStatusJob() {
  if (!env.enableCron) {
    console.log("Cron job is disabled (ENABLE_CRON=false)");
    return;
  }

  if (!cron.validate(env.cronSchedule)) {
    console.warn(`Invalid CRON_SCHEDULE "${env.cronSchedule}". The cron job was not started.`);
    return;
  }

  const runJob = async () => {
    try {
      const count = await completeFinishedBookings();
      console.log(`[cron] ${count} finished rental(s) marked as completed`);
    } catch (error) {
      console.error("[cron] job failed:", error.message);
    }
  };

  cron.schedule(env.cronSchedule, runJob);
  console.log(`Cron job scheduled: "${env.cronSchedule}"`);

  runJob(); 
}

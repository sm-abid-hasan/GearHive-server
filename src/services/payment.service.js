import { collections } from "../config/db.js";
import { BOOKING_STATUS, PAYMENT_STATUS } from "../config/constants.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";


export async function finalizeCheckoutSession(session) {
  if (session.payment_status !== "paid") {
    return { paid: false, booking: null };
  }

  const bookingId = session.metadata?.bookingId;
  if (!bookingId) throw new HttpError(400, "This payment is not linked to a booking");

  const booking = await collections.bookings.findOne({ _id: toObjectId(bookingId, "booking id") });
  if (!booking) throw new HttpError(404, "Booking not found");

  const now = new Date();
  const paymentIntentId =
    typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null;


  try {
    await collections.payments.updateOne(
      { stripeSessionId: session.id },
      {
        $setOnInsert: {
          stripeSessionId: session.id,
          paymentIntentId,
          bookingId: booking._id,
          equipmentId: booking.equipmentId,
          equipmentName: booking.equipmentName,
          customerEmail: booking.customerEmail,
          customerName: booking.customerName,
          ownerEmail: booking.ownerEmail,
          amount: (session.amount_total || 0) / 100, 
          currency: session.currency || "usd",
          status: "paid",
          createdAt: now,
        },
      },
      { upsert: true }
    );
  } catch (error) {

    if (error.code !== 11000) throw error;
  }


  await collections.bookings.updateOne(
    { _id: booking._id, paymentStatus: PAYMENT_STATUS.UNPAID },
    {
      $set: {
        paymentStatus: PAYMENT_STATUS.PAID,
        bookingStatus: BOOKING_STATUS.CONFIRMED,
        transactionId: paymentIntentId,
        stripeSessionId: session.id,
        paidAt: now,
        updatedAt: now,
      },
    }
  );

  const updatedBooking = await collections.bookings.findOne({ _id: booking._id });
  return { paid: true, booking: updatedBooking };
}

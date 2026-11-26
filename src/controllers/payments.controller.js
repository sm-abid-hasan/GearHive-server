import { collections, connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { EQUIPMENT_STATUS, BOOKING_STATUS, PAYMENT_STATUS } from "../config/constants.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { toObjectId } from "../utils/objectId.js";
import { getStripe } from "../services/stripe.service.js";
import { finalizeCheckoutSession } from "../services/payment.service.js";
import { getRemainingQuantity } from "../services/availability.service.js";

const formatDate = (date) => date.toISOString().slice(0, 10);


export const createCheckoutSession = asyncHandler(async (req, res) => {
  const bookingId = toObjectId(req.body.bookingId, "booking id");

  const booking = await collections.bookings.findOne({ _id: bookingId });
  if (!booking) throw new HttpError(404, "Booking not found");
  if (booking.customerEmail !== req.user.email) throw new HttpError(403, "Forbidden: this is not your booking");

  if (booking.paymentStatus === PAYMENT_STATUS.PAID || booking.bookingStatus !== BOOKING_STATUS.AWAITING_PAYMENT) {
    throw new HttpError(400, "This booking is already paid or no longer waiting for payment");
  }


  const equipment = await collections.equipment.findOne({ _id: booking.equipmentId });
  if (!equipment || equipment.status !== EQUIPMENT_STATUS.APPROVED) {
    throw new HttpError(409, "This equipment is no longer available");
  }
  const remaining = await getRemainingQuantity(equipment, booking.startDate, booking.endDate, booking._id);
  if (booking.quantity > remaining) {
    throw new HttpError(409, "Sorry, the equipment is no longer available for these dates");
  }


  if (booking.totalAmount < 0.5) throw new HttpError(400, "The total amount is too small to pay online");

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: booking.customerEmail,
    client_reference_id: String(booking._id),
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: Math.round(booking.totalAmount * 100), 
          product_data: {
            name: `Rental: ${booking.equipmentName}`,
            description: `${formatDate(booking.startDate)} to ${formatDate(booking.endDate)} - ${booking.quantity} unit(s)`,
          },
        },
      },
    ],
  
    metadata: { bookingId: String(booking._id) },
    success_url: `${env.clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/payment/cancel?booking_id=${booking._id}`,
  });

  await collections.bookings.updateOne(
    { _id: booking._id },
    { $set: { stripeSessionId: session.id, updatedAt: new Date() } }
  );

  res.json({ url: session.url, sessionId: session.id });
});


export const confirmPayment = asyncHandler(async (req, res) => {
  const { sessionId } = req.body;
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) {
    throw new HttpError(400, "Invalid payment session id");
  }

  const stripe = getStripe();
  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (error) {
    throw new HttpError(404, "Payment session not found");
  }


  const booking = session.metadata?.bookingId
    ? await collections.bookings.findOne({ _id: toObjectId(session.metadata.bookingId, "booking id") })
    : null;
  if (!booking) throw new HttpError(404, "Booking not found for this payment");
  if (booking.customerEmail !== req.user.email) throw new HttpError(403, "Forbidden: this is not your payment");

  const result = await finalizeCheckoutSession(session);
  if (!result.paid) {
    return res.status(402).json({ paid: false, message: "Payment has not been completed yet" });
  }

  res.json({ paid: true, message: "Payment successful", booking: result.booking });
});


export const stripeWebhook = async (req, res) => {
  if (!env.stripeWebhookSecret) {
    return res.status(400).send("Webhook is not configured");
  }

  let event;
  try {

    event = getStripe().webhooks.constructEvent(req.body, req.headers["stripe-signature"], env.stripeWebhookSecret);
  } catch (error) {
    return res.status(400).send(`Webhook signature error: ${error.message}`);
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await connectDB();
      await finalizeCheckoutSession(event.data.object);
    }
    res.json({ received: true });
  } catch (error) {
    console.error("Webhook handling failed:", error);
    res.status(500).send("Webhook handler failed");
  }
};

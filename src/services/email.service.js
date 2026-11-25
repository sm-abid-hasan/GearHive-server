
import nodemailer from "nodemailer";
import { env } from "../config/env.js";

let transporter = null;

function getTransporter() {
  const { host, port, user, pass } = env.smtp;
  if (!host || !user || !pass) return null; 

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, 
      auth: { user, pass },
    });
  }
  return transporter;
}

async function sendMail(to, subject, html) {
  const mailer = getTransporter();
  if (!mailer) {
    console.log(`[email skipped - SMTP not configured] ${subject} -> ${to}`);
    return;
  }

  try {
    await mailer.sendMail({ from: env.smtp.from, to, subject, html });
    console.log(`E-mail sent: "${subject}" -> ${to}`);
  } catch (error) {

    console.error(`Could not send e-mail to ${to}:`, error.message);
  }
}

const formatDate = (date) => new Date(date).toISOString().slice(0, 10);


export async function sendBookingCompletedEmails(booking) {
  const period = `${formatDate(booking.startDate)} to ${formatDate(booking.endDate)}`;

  const customerHtml = `
    <h2>Your rental is completed</h2>
    <p>Hi ${booking.customerName},</p>
    <p>Your rental of <strong>${booking.equipmentName}</strong> (${period}) is now completed.
    Thank you for choosing GearHive!</p>
    <p>Total paid: <strong>$${booking.totalAmount}</strong></p>`;

  const ownerHtml = `
    <h2>A rental of your equipment is completed</h2>
    <p>Hi ${booking.ownerName},</p>
    <p>The rental of <strong>${booking.equipmentName}</strong> by ${booking.customerName} (${period}) is now completed.</p>
    <p>Booking amount: <strong>$${booking.totalAmount}</strong></p>`;

  await Promise.all([
    sendMail(booking.customerEmail, "Your GearHive rental is completed", customerHtml),
    sendMail(booking.ownerEmail, "A rental of your equipment is completed", ownerHtml),
  ]);
}

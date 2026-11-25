
import dotenv from "dotenv";

dotenv.config();


const splitList = (value = "") =>
  value
    .split(",")
    .map((item) => item.trim().replace(/\/$/, ""))
    .filter(Boolean);

const clientOrigins = splitList(process.env.CLIENT_URL || "http://localhost:3000");

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,

  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.MONGODB_DB || "gearhive",

  jwtSecret: process.env.JWT_SECRET,

 
  clientUrl: clientOrigins[0],

  allowedOrigins: clientOrigins,

  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,

  enableCron: process.env.ENABLE_CRON !== "false",
  cronSchedule: process.env.CRON_SCHEDULE || "5 0 * * *",

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.EMAIL_FROM || "GearHive <no-reply@gearhive.example>",
  },
};


export function assertRequiredEnv() {
  const missing = [];
  if (!env.mongoUri) missing.push("MONGODB_URI");
  if (!env.jwtSecret) missing.push("JWT_SECRET");

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. ` +
        "Copy .env.example to .env and fill in the values."
    );
  }
}

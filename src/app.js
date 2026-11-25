
import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { ensureDb } from "./middlewares/ensureDb.js";
import { notFound, errorHandler } from "./middlewares/errorHandlers.js";
import apiRoutes from "./routes/index.js";
import { stripeWebhook } from "./controllers/payments.controller.js";

const app = express();


app.use(
  cors({
    origin(origin, callback) {

      if (!origin || env.allowedOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);


app.post("/api/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook);


app.use(express.json({ limit: "1mb" }));


app.get("/", (req, res) => {
  res.json({ name: "GearHive API", status: "running" });
});


app.use("/api", ensureDb, apiRoutes);


app.use(notFound);
app.use(errorHandler);

export default app;

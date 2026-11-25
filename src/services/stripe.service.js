import Stripe from "stripe";
import { env } from "../config/env.js";
import { HttpError } from "../utils/httpError.js";

let stripeClient = null;


export function getStripe() {
  if (!env.stripeSecretKey) {
    throw new HttpError(500, "Stripe is not configured on the server (STRIPE_SECRET_KEY is missing)");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(env.stripeSecretKey);
  }
  return stripeClient;
}

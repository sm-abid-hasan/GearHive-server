import { asyncHandler } from "../utils/asyncHandler.js";
import { getAdminAnalytics, getOwnerAnalytics, getCustomerAnalytics } from "../services/analytics.service.js";


export const adminAnalytics = asyncHandler(async (req, res) => {
  res.json(await getAdminAnalytics());
});


export const ownerAnalytics = asyncHandler(async (req, res) => {
  res.json(await getOwnerAnalytics(req.user.email));
});


export const customerAnalytics = asyncHandler(async (req, res) => {
  res.json(await getCustomerAnalytics(req.user.email));
});

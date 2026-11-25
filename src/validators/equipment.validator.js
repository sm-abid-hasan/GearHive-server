import { CATEGORIES, RENTAL_TYPES, CONDITIONS } from "../config/constants.js";


export function validateEquipmentPayload(body = {}, { minQuantity = 0 } = {}) {
  const errors = [];
  const data = {};


  const readText = (key, label, min, max) => {
    const value = typeof body[key] === "string" ? body[key].trim() : "";
    if (value.length < min || value.length > max) {
      errors.push(`${label} must be between ${min} and ${max} characters`);
    } else {
      data[key] = value;
    }
  };


  const readChoice = (key, label, allowed) => {
    if (!allowed.includes(body[key])) {
      errors.push(`${label} must be one of: ${allowed.join(", ")}`);
    } else {
      data[key] = body[key];
    }
  };

  readText("name", "Equipment name", 3, 100);
  readText("description", "Description", 10, 2000);
  readText("location", "Location", 2, 100);
  readText("brand", "Brand", 1, 60);
  readText("model", "Model", 1, 60);
  readText("terms", "Rental terms and conditions", 5, 3000);

  readChoice("category", "Category", CATEGORIES);
  readChoice("rentalType", "Rental type", RENTAL_TYPES);
  readChoice("condition", "Equipment condition", CONDITIONS);

  // Rental price
  const price = Number(body.price);
  if (!Number.isFinite(price) || price <= 0 || price > 1000000) {
    errors.push("Rental price must be a number greater than 0");
  } else {
    data.price = Math.round(price * 100) / 100;
  }


  const quantity = Number(body.availableQuantity);
  if (!Number.isInteger(quantity) || quantity < minQuantity || quantity > 100000) {
    errors.push(`Available quantity must be a whole number of at least ${minQuantity}`);
  } else {
    data.availableQuantity = quantity;
  }


  const image = typeof body.image === "string" ? body.image.trim() : "";
  if (!/^https?:\/\/\S+$/i.test(image) && !/^\/\S+$/.test(image)) {
    errors.push("Equipment image is required (upload an image or paste a direct image link)");
  } else {
    data.image = image;
  }

  return { errors, data };
}

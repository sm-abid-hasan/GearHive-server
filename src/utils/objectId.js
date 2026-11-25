import { ObjectId } from "mongodb";
import { HttpError } from "./httpError.js";


export function toObjectId(id, label = "id") {
  if (typeof id !== "string" || !/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new HttpError(400, `Invalid ${label}`);
  }
  return new ObjectId(id);
}

import { HttpError } from "../utils/httpError.js";


export const notFound = (req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
};


export const errorHandler = (error, req, res, next) => {
  const status = error.status || 500;

  if (status >= 500) {
    console.error("Server error:", error);
  }

  const message = error instanceof HttpError ? error.message : status >= 500 ? "Something went wrong on the server." : error.message;

  res.status(status).json({ message });
};

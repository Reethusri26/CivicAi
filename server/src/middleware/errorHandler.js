import multer from "multer";
import mongoose from "mongoose";
import env from "../config/env.js";
import AppError from "../utils/AppError.js";

const MULTER_MESSAGES = {
  LIMIT_FILE_SIZE: `Each image must be ${Math.round(env.maxImageBytes / 1024 / 1024)} MB or smaller`,
  LIMIT_FILE_COUNT: `You can upload up to ${env.maxImagesPerUpload} images at a time`,
  LIMIT_UNEXPECTED_FILE: "Unexpected file field",
};

export const notFoundHandler = (req, res) => {
  res.status(404).json({ success: false, message: "Endpoint not found" });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  let status = 500;
  let message = "Something went wrong. Please try again.";
  let details;

  if (err instanceof AppError) {
    status = err.status;
    message = err.message;
    details = err.details;
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = MULTER_MESSAGES[err.code] || "File upload failed";
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = "Invalid identifier";
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = Object.values(err.errors)[0]?.message || "Invalid input";
  } else if (err?.code === 11000) {
    status = 409;
    message = "A record with these details already exists";
  } else if (err?.type === "entity.parse.failed") {
    status = 400;
    message = "Malformed JSON body";
  } else if (err?.type === "entity.too.large") {
    status = 413;
    message = "Request body is too large";
  }

  if (status >= 500 && !env.isTest) {
    console.error(err);
  }

  res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
};

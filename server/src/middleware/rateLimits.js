import rateLimit from "express-rate-limit";
import env from "../config/env.js";

const make = (windowMinutes, limit, message) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    skip: () => env.isTest,
    message: { success: false, message },
  });

export const authLimiter = make(15, 20, "Too many sign-in attempts. Please try again in a few minutes.");

export const createComplaintLimiter = make(60, 20, "You have submitted many complaints recently. Please try again later.");

export const publicLimiter = make(15, 100, "Too many requests. Please slow down.");

export const aiLimiter = make(15, 30, "Too many AI analysis requests. Please wait a few minutes.");

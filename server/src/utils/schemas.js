import mongoose from "mongoose";
import { z } from "zod";
import { CATEGORIES, PRIORITIES, STATUSES } from "../config/constants.js";

export const objectId = z
  .string()
  .refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid identifier");

export const email = z.string().trim().toLowerCase().email("Enter a valid email address").max(254);

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[A-Za-z]/, "Password must contain a letter")
  .regex(/[0-9]/, "Password must contain a number");

const phone = z
  .string()
  .trim()
  .max(20)
  .regex(/^[+\d\s()-]*$/, "Enter a valid phone number")
  .optional()
  .default("");

const optionalNumber = (min, max) =>
  z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? null : Number(value)),
    z.number().min(min).max(max).nullable()
  );

export const registerSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email,
  password,
  phone,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password").max(128),
  role: z.enum(["citizen", "worker", "admin"]).optional().default("citizen"),
});

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: phone.optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: password,
});

export const createComplaintSchema = z
  .object({
    title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
    description: z.string().trim().min(15, "Please describe the issue in at least 15 characters").max(2000),
    // Empty or "auto" lets AI (or the rule fallback) choose.
    category: z.union([z.enum(CATEGORIES), z.literal(""), z.literal("auto")]).optional().default(""),
    address: z.string().trim().max(300).optional().default(""),
    landmark: z.string().trim().max(120).optional().default(""),
    latitude: optionalNumber(-90, 90),
    longitude: optionalNumber(-180, 180),
  })
  .refine((data) => (data.latitude === null) === (data.longitude === null), {
    message: "Latitude and longitude must be provided together",
    path: ["latitude"],
  })
  .refine((data) => data.address.length >= 5 || data.latitude !== null, {
    message: "Provide an address or share your location",
    path: ["address"],
  });

export const updateComplaintSchema = z.object({
  title: z.string().trim().min(5).max(120).optional(),
  description: z.string().trim().min(15).max(2000).optional(),
  category: z.enum(CATEGORIES).optional(),
  address: z.string().trim().max(300).optional(),
  landmark: z.string().trim().max(120).optional(),
});

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, "Choose a rating").max(5),
  comment: z.string().trim().max(1000).optional().default(""),
});

const pagination = {
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
};

export const citizenListQuery = z.object({
  ...pagination,
  status: z.enum(STATUSES).optional(),
  q: z.string().trim().max(100).optional(),
});

export const adminListQuery = z.object({
  ...pagination,
  status: z.enum(STATUSES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  category: z.enum(CATEGORIES).optional(),
  department: z.string().trim().max(60).optional(),
  worker: z.union([objectId, z.literal("unassigned")]).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(["newest", "oldest", "priority", "updated"]).optional().default("newest"),
});

export const assignSchema = z.object({
  workerId: objectId,
  reason: z.string().trim().max(300).optional().default(""),
});

export const adminUpdateSchema = z.object({
  category: z.enum(CATEGORIES).optional(),
  priority: z.enum(PRIORITIES).optional(),
  department: z.string().trim().max(60).optional(),
});

export const noteSchema = z.object({
  text: z.string().trim().min(2, "Note is too short").max(1000),
  visibleToCitizen: z.preprocess(
    (value) => (value === "false" ? false : value === "true" ? true : value),
    z.boolean().optional().default(true)
  ),
});

export const createWorkerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email,
  password,
  department: z.string().trim().min(1, "Choose a department").max(60),
  phone,
});

export const updateWorkerSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  department: z.string().trim().min(1).max(60).optional(),
  phone: phone.optional(),
  isActive: z.boolean().optional(),
});

export const resetPasswordSchema = z.object({ password });

export const departmentSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).optional().default(""),
  categories: z.array(z.enum(CATEGORIES)).optional().default([]),
});

export const exportQuery = z.object({
  status: z.enum(STATUSES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

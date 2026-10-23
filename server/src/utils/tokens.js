import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../models/User.js";
import Admin from "../models/Admin.js";
import Worker from "../models/Worker.js";

export const MODEL_BY_ROLE = { citizen: User, admin: Admin, worker: Worker };

export const signToken = (account, role) =>
  jwt.sign({ sub: String(account._id), role, tv: account.tokenVersion || 0 }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });

export const verifyToken = (token) => jwt.verify(token, env.jwtSecret);

// Shape returned to the browser. Never includes the password hash.
export const publicAccount = (account, role) => ({
  id: String(account._id),
  role,
  name: account.fullName || account.name,
  email: account.email,
  phone: account.phone || "",
  department: role === "worker" ? account.department : undefined,
  createdAt: account.createdAt,
});

import bcrypt from "bcrypt";
import env from "../config/env.js";
import User from "../models/User.js";
import AppError, { badRequest } from "../utils/AppError.js";
import { MODEL_BY_ROLE, publicAccount, signToken } from "../utils/tokens.js";

const BCRYPT_ROUNDS = 12;

// Compared against when the email is unknown, so response time does not
// reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync("civicai-timing-equaliser", 10);

// Passwords shipped by the original seed scripts. Blocked in production so a
// forgotten default account cannot be used.
const KNOWN_DEFAULT_PASSWORDS = ["admin123", "worker123"];

export const hashPassword = (plain) => bcrypt.hash(plain, BCRYPT_ROUNDS);

const sessionResponse = (account, role) => ({
  success: true,
  token: signToken(account, role),
  user: publicAccount(account, role),
});

export const register = async (req, res) => {
  const { fullName, email, password, phone } = req.body;

  if (await User.exists({ email })) {
    throw new AppError(409, "An account with this email already exists. Try signing in.");
  }

  const user = await User.create({ fullName, email, phone, password: await hashPassword(password) });

  res.status(201).json({ ...sessionResponse(user, "citizen"), message: "Account created" });
};

const loginAs = async (role, email, password) => {
  const account = await MODEL_BY_ROLE[role].findOne({ email }).select("+password");
  const valid = await bcrypt.compare(password, account?.password || DUMMY_HASH);

  if (!account || !valid) {
    throw new AppError(401, "Incorrect email or password");
  }

  if (!account.isActive) {
    throw new AppError(403, "This account has been deactivated. Contact your administrator.");
  }

  if (env.isProduction && role !== "citizen" && KNOWN_DEFAULT_PASSWORDS.includes(password)) {
    throw new AppError(
      403,
      "This account still uses a default password, which is disabled in production. Ask an administrator to reset it."
    );
  }

  return account;
};

export const login = async (req, res) => {
  const { email, password, role } = req.body;
  const account = await loginAs(role, email, password);
  res.json({ ...sessionResponse(account, role), message: "Signed in" });
};

// Kept for clients that still call /api/admin/login and /api/worker/login.
export const loginForRole = (role) => async (req, res) => {
  req.body.role = role;
  return login(req, res);
};

export const me = async (req, res) => {
  res.json({ success: true, user: publicAccount(req.user.account, req.user.role) });
};

export const updateProfile = async (req, res) => {
  const { account, role } = req.user;
  const { name, phone } = req.body;

  if (name !== undefined) {
    if (role === "citizen") account.fullName = name;
    else account.name = name;
  }
  if (phone !== undefined) account.phone = phone;

  await account.save();
  res.json({ success: true, user: publicAccount(account, role), message: "Profile updated" });
};

export const changePassword = async (req, res) => {
  const { role } = req.user;
  const account = await MODEL_BY_ROLE[role].findById(req.user.id).select("+password");

  if (!(await bcrypt.compare(req.body.currentPassword, account.password))) {
    throw badRequest("Your current password is incorrect");
  }

  account.password = await hashPassword(req.body.newPassword);
  account.tokenVersion = (account.tokenVersion || 0) + 1;
  await account.save();

  // Other sessions are invalidated; this one receives a fresh token.
  res.json({ ...sessionResponse(account, role), message: "Password changed" });
};

// Invalidates every token issued to this account.
export const logout = async (req, res) => {
  const { account } = req.user;
  account.tokenVersion = (account.tokenVersion || 0) + 1;
  await account.save();
  res.json({ success: true, message: "Signed out" });
};

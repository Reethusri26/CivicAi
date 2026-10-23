import crypto from "crypto";
import bcrypt from "bcrypt";
import env from "../config/env.js";
import { verifyGoogleToken } from "../services/googleAuth.js";
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

const sessionResponse = (account, role, remember = false) => ({
  success: true,
  token: signToken(account, role, remember),
  remember,
  user: publicAccount(account, role),
});

export const register = async (req, res) => {
  const { fullName, email, password, phone, remember } = req.body;

  if (await User.exists({ email })) {
    throw new AppError(409, "An account with this email already exists. Try signing in.");
  }

  const user = await User.create({ fullName, email, phone, password: await hashPassword(password) });

  res.status(201).json({ ...sessionResponse(user, "citizen", remember), message: "Account created" });
};

// Google sign-in for residents. The browser obtains an ID token from Google
// Identity Services; we verify its signature, audience and expiry with
// Google's library, then find or create the citizen account by verified email.
export const googleSignIn = async (req, res) => {
  if (!env.googleClientId) {
    throw new AppError(503, "Google sign-in is not configured on this server");
  }

  let payload;
  try {
    payload = await verifyGoogleToken(req.body.credential);
  } catch {
    throw new AppError(401, "Google sign-in failed. Please try again.");
  }

  if (!payload?.email || payload.email_verified !== true) {
    throw new AppError(401, "Your Google account email is not verified");
  }

  const email = payload.email.trim().toLowerCase();
  let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });
  let created = false;

  if (!user) {
    user = await User.create({
      fullName: (payload.name || email.split("@")[0]).slice(0, 80),
      email,
      googleId: payload.sub,
      authProviders: ["google"],
      // Random password nobody knows; the user can set a real one in Profile.
      password: await hashPassword(crypto.randomBytes(32).toString("base64url")),
      isVerified: true,
    });
    created = true;
  } else {
    if (!user.isActive) {
      throw new AppError(403, "This account has been deactivated. Contact support.");
    }
    // Google has verified ownership of this email, so it is safe to link.
    if (!user.googleId) user.googleId = payload.sub;
    if (!user.authProviders.includes("google")) user.authProviders.push("google");
    user.isVerified = true;
    await user.save();
  }

  res.status(created ? 201 : 200).json({
    ...sessionResponse(user, "citizen", req.body.remember),
    message: created ? "Account created with Google" : "Signed in with Google",
  });
};

export const authConfig = (req, res) => {
  res.json({ success: true, googleEnabled: Boolean(env.googleClientId) });
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
  const { email, password, role, remember } = req.body;
  const account = await loginAs(role, email, password);
  res.json({ ...sessionResponse(account, role, remember), message: "Signed in" });
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

  // Accounts created with Google have no password the user knows yet.
  const settingFirstPassword = role === "citizen" && !(account.authProviders || ["password"]).includes("password");

  if (!settingFirstPassword && !(await bcrypt.compare(req.body.currentPassword || "", account.password))) {
    throw badRequest("Your current password is incorrect");
  }

  account.password = await hashPassword(req.body.newPassword);
  account.tokenVersion = (account.tokenVersion || 0) + 1;
  if (settingFirstPassword) account.authProviders.push("password");
  await account.save();

  // Other sessions are invalidated; this one receives a fresh token.
  res.json({
    ...sessionResponse(account, role, req.body.remember),
    message: settingFirstPassword ? "Password set. You can now also sign in with email and password." : "Password changed",
  });
};

// Invalidates every token issued to this account.
export const logout = async (req, res) => {
  const { account } = req.user;
  account.tokenVersion = (account.tokenVersion || 0) + 1;
  await account.save();
  res.json({ success: true, message: "Signed out" });
};

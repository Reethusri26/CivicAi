import Admin from "../models/Admin.js";
import { hashPassword } from "../controllers/authController.js";

// Creates the first admin only when ADMIN_EMAIL and ADMIN_PASSWORD are set and
// no admin exists yet. There is no hardcoded default account.
export const ensureBootstrapAdmin = async () => {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if ((await Admin.estimatedDocumentCount()) > 0) return;

  if (!email || !password) {
    console.warn("No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD, or run `npm run admin:create`.");
    return;
  }

  if (password.length < 12) {
    console.warn("ADMIN_PASSWORD must be at least 12 characters; bootstrap admin not created.");
    return;
  }

  await Admin.create({
    name: process.env.ADMIN_NAME || "Administrator",
    email,
    password: await hashPassword(password),
  });
  console.log(`Bootstrap admin created for ${email}. Remove ADMIN_PASSWORD from the environment now.`);
};

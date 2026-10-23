// Creates an admin, or resets an existing admin's password.
// Usage: npm run admin:create -- --email admin@example.org --name "Jane Doe"
// The password is read from the ADMIN_PASSWORD environment variable or
// prompted for, so it never appears in shell history.
import readline from "readline";
import mongoose from "mongoose";
import env, { assertRequiredEnv } from "../src/config/env.js";
import Admin from "../src/models/Admin.js";
import { hashPassword } from "../src/controllers/authController.js";

const arg = (name) => {
  const index = process.argv.indexOf(`--${name}`);
  return index > -1 ? process.argv[index + 1] : undefined;
};

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const main = async () => {
  assertRequiredEnv();
  const email = (arg("email") || (await ask("Admin email: "))).trim().toLowerCase();
  const name = arg("name") || "Administrator";
  const password = process.env.ADMIN_PASSWORD || (await ask("New password (min 12 chars): "));

  if (password.length < 12) throw new Error("Password must be at least 12 characters");

  await mongoose.connect(env.mongoUri);
  const hash = await hashPassword(password);
  const existing = await Admin.findOne({ email });

  if (existing) {
    existing.password = hash;
    existing.tokenVersion = (existing.tokenVersion || 0) + 1;
    await existing.save();
    console.log(`Password reset for ${email}; existing sessions signed out.`);
  } else {
    await Admin.create({ name, email, password: hash });
    console.log(`Admin ${email} created.`);
  }
  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error(error.message);
  await mongoose.disconnect();
  process.exit(1);
});

// Local demo server backed by an in-memory MongoDB. Nothing is persisted and
// no real database credentials are needed. Seeds demo accounts whose
// passwords are printed below — for local development only.
import { MongoMemoryServer } from "mongodb-memory-server";

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri("civicai");
process.env.JWT_SECRET ||= "local-dev-only-secret-change-me-0123456789";
process.env.NODE_ENV ||= "development";

const { default: env } = await import("../src/config/env.js");
const { default: connectDB } = await import("../src/config/database.js");
const { default: app } = await import("../src/app.js");
const { ensureDefaultDepartments } = await import("../src/services/departmentService.js");
const { hashPassword } = await import("../src/controllers/authController.js");
const { default: Admin } = await import("../src/models/Admin.js");
const { default: Worker } = await import("../src/models/Worker.js");
const { default: User } = await import("../src/models/User.js");

await connectDB(env.mongoUri);
await ensureDefaultDepartments();

const DEMO_PASSWORD = "Demo-pass-2026";
const hash = await hashPassword(DEMO_PASSWORD);
await Admin.create({ name: "Demo Admin", email: "admin@demo.local", password: hash });
await Worker.create([
  { name: "Ravi Kumar", email: "roads@demo.local", password: hash, department: "Roads", phone: "+91 90000 00001" },
  { name: "Asha Rao", email: "sanitation@demo.local", password: hash, department: "Sanitation" },
  { name: "Imran Shaikh", email: "water@demo.local", password: hash, department: "Water" },
]);
await User.create({ fullName: "Demo Citizen", email: "citizen@demo.local", password: hash });

app.listen(env.port, () => {
  console.log(`CivicAI demo API on http://localhost:${env.port} (in-memory database)`);
  console.log(`Demo accounts (password ${DEMO_PASSWORD}): admin@demo.local, roads@demo.local, sanitation@demo.local, water@demo.local, citizen@demo.local`);
});

import env, { assertRequiredEnv } from "./config/env.js";
import connectDB from "./config/database.js";
import app from "./app.js";
import { ensureDefaultDepartments } from "./services/departmentService.js";
import { ensureBootstrapAdmin } from "./utils/bootstrapAdmin.js";

const start = async () => {
  assertRequiredEnv();
  await connectDB(env.mongoUri);
  await ensureDefaultDepartments();
  await ensureBootstrapAdmin();

  app.listen(env.port, () => {
    console.log(`CivicAI API listening on port ${env.port} (${env.nodeEnv})`);
    if (!env.geminiApiKey) {
      console.log("GEMINI_API_KEY not set: complaints will use the rule-based classifier.");
    }
  });
};

start().catch((error) => {
  console.error("Failed to start server:", error.message);
  process.exit(1);
});

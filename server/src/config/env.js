import dotenv from "dotenv";

const nodeEnv = process.env.NODE_ENV || "development";

// Tests must never pick up real credentials from a local .env file.
if (nodeEnv !== "test") {
  dotenv.config({ quiet: true });
}

const env = {
  nodeEnv,
  isProduction: nodeEnv === "production",
  isTest: nodeEnv === "test",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  // Used when the user ticks "Keep me signed in".
  jwtRememberExpiresIn: process.env.JWT_REMEMBER_EXPIRES_IN || "30d",
  // OAuth client ID from Google Cloud Console; Google sign-in is off when empty.
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  geminiApiKey: process.env.GEMINI_API_KEY || "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  geminiTimeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 12000,
  geminiAnalyzeImages: process.env.GEMINI_ANALYZE_IMAGES === "true",
  maxImageBytes: Number(process.env.MAX_IMAGE_MB || 5) * 1024 * 1024,
  maxImagesPerUpload: Number(process.env.MAX_IMAGES_PER_UPLOAD) || 5,
};

// Secrets used to sign short-lived file URLs. Falls back to the JWT secret.
export const fileUrlSecret = () => process.env.FILE_URL_SECRET || process.env.JWT_SECRET;

export const assertRequiredEnv = () => {
  const missing = ["MONGODB_URI", "JWT_SECRET"].filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  if (env.isProduction && process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
};

export default env;

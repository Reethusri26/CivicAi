import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "path";
import { fileURLToPath } from "url";

import env from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import complaintRoutes from "./routes/complaintRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import workerRoutes from "./routes/workerRoutes.js";
import miscRoutes from "./routes/miscRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Render terminates TLS in front of the app; needed for correct client IPs in rate limiting.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: (origin, callback) => {
      // Non-browser clients (curl, health checks) send no Origin header.
      if (!origin || env.corsOrigins.includes(origin)) return callback(null, true);
      return callback(null, false);
    },
    exposedHeaders: ["Content-Disposition"],
  })
);

app.use(express.json({ limit: "100kb" }));

// Images uploaded by the earlier disk-storage version, if the folder still exists.
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), { fallthrough: true }));

app.get("/", (req, res) => {
  res.json({ success: true, message: "CivicAI API" });
});

app.get("/api/health", (req, res) => {
  res.json({ success: true, status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api", miscRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;

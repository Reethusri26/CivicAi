import express from "express";
import {
  getFile,
  getNotifications,
  publicStats,
  readNotifications,
  trackByReference,
} from "../controllers/miscController.js";
import { authenticate } from "../middleware/auth.js";
import { publicLimiter } from "../middleware/rateLimits.js";

const router = express.Router();

router.get("/files/:id", getFile);
router.get("/notifications", authenticate, getNotifications);
router.post("/notifications/read", authenticate, readNotifications);
router.get("/public/stats", publicLimiter, publicStats);
router.get("/public/track/:reference", publicLimiter, trackByReference);

export default router;

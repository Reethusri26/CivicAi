import express from "express";
import {
  authConfig,
  changePassword,
  googleSignIn,
  login,
  logout,
  me,
  register,
  updateProfile,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import { changePasswordSchema, googleSchema, loginSchema, profileSchema, registerSchema } from "../utils/schemas.js";

const router = express.Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/google", authLimiter, validate(googleSchema), googleSignIn);
router.get("/config", authConfig);
router.get("/me", authenticate, me);
router.patch("/me", authenticate, validate(profileSchema), updateProfile);
router.post("/change-password", authenticate, authLimiter, validate(changePasswordSchema), changePassword);
router.post("/logout", authenticate, logout);

export default router;

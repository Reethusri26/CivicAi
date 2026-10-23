import express from "express";
import { z } from "zod";
import { loginForRole } from "../controllers/authController.js";
import { addNote, completeTask, getTask, listTasks, startTask, uploadEvidence } from "../controllers/workerController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimits.js";
import { imagesUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { loginSchema, noteSchema, objectId } from "../utils/schemas.js";

const router = express.Router();
const idParam = validate(z.object({ id: objectId }), "params");

// Legacy login path; same handler as POST /api/auth/login with role "worker".
router.post("/login", authLimiter, validate(loginSchema), loginForRole("worker"));

router.use(authenticate, authorize("worker"));

router.get("/tasks", listTasks);
router.get("/tasks/:id", idParam, getTask);
router.post("/tasks/:id/start", idParam, startTask);
router.post("/tasks/:id/notes", idParam, validate(noteSchema), addNote);
router.post("/tasks/:id/evidence", idParam, imagesUpload("images"), uploadEvidence);
router.post("/tasks/:id/complete", idParam, imagesUpload("images"), completeTask);

export default router;

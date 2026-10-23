import express from "express";
import { z } from "zod";
import * as admin from "../controllers/adminController.js";
import { loginForRole } from "../controllers/authController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { aiLimiter, authLimiter } from "../middleware/rateLimits.js";
import { validate } from "../middleware/validate.js";
import {
  adminListQuery,
  adminUpdateSchema,
  assignSchema,
  createWorkerSchema,
  departmentSchema,
  exportQuery,
  loginSchema,
  noteSchema,
  objectId,
  resetPasswordSchema,
  updateWorkerSchema,
} from "../utils/schemas.js";

const router = express.Router();
const idParam = validate(z.object({ id: objectId }), "params");

// Legacy login path; same handler as POST /api/auth/login with role "admin".
router.post("/login", authLimiter, validate(loginSchema), loginForRole("admin"));

router.use(authenticate, authorize("admin"));

router.get("/overview", admin.overview);
router.get("/analytics", admin.analytics);
router.get("/ai-evaluation", admin.aiEvaluation);
router.get("/reports/complaints.csv", validate(exportQuery, "query"), admin.exportComplaints);

router.get("/complaints", validate(adminListQuery, "query"), admin.listComplaints);
router.get("/complaints/:id", idParam, admin.getComplaint);
router.patch("/complaints/:id", idParam, validate(adminUpdateSchema), admin.updateComplaintFields);
router.post("/complaints/:id/review", idParam, admin.reviewComplaint);
router.post("/complaints/:id/assign", idParam, validate(assignSchema), admin.assignComplaint);
router.post("/complaints/:id/apply-ai", idParam, admin.applyAiSuggestion);
router.post("/complaints/:id/reanalyze", idParam, aiLimiter, admin.reanalyzeComplaint);
router.post("/complaints/:id/notes", idParam, validate(noteSchema), admin.addAdminNote);

router.get("/workers", admin.listWorkers);
router.post("/workers", validate(createWorkerSchema), admin.createWorker);
router.patch("/workers/:id", idParam, validate(updateWorkerSchema), admin.updateWorker);
router.post("/workers/:id/reset-password", idParam, validate(resetPasswordSchema), admin.resetWorkerPassword);

router.get("/departments", admin.listDepartments);
router.post("/departments", validate(departmentSchema), admin.createDepartment);
router.put("/departments/:id", idParam, validate(departmentSchema), admin.updateDepartment);
router.delete("/departments/:id", idParam, admin.deleteDepartment);

export default router;

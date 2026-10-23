import express from "express";
import {
  createComplaint,
  deleteComplaint,
  getMyComplaint,
  getMyComplaints,
  getMyStats,
  submitFeedback,
  updateComplaint,
} from "../controllers/complaintController.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { createComplaintLimiter } from "../middleware/rateLimits.js";
import { imagesUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
  citizenListQuery,
  createComplaintSchema,
  feedbackSchema,
  objectId,
  updateComplaintSchema,
} from "../utils/schemas.js";
import { z } from "zod";

const router = express.Router();
const idParam = validate(z.object({ id: objectId }), "params");

router.use(authenticate, authorize("citizen"));

router.post("/", createComplaintLimiter, imagesUpload("images"), validate(createComplaintSchema), createComplaint);
router.get("/", validate(citizenListQuery, "query"), getMyComplaints);
router.get("/stats", getMyStats);
router.get("/:id", idParam, getMyComplaint);
router.put("/:id", idParam, validate(updateComplaintSchema), updateComplaint);
router.delete("/:id", idParam, deleteComplaint);
router.post("/:id/feedback", idParam, validate(feedbackSchema), submitFeedback);

export default router;

import multer from "multer";
import env from "../config/env.js";
import { badRequest } from "../utils/AppError.js";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Files are held in memory, checked, then written to GridFS by storageService.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.maxImageBytes,
    files: env.maxImagesPerUpload,
    fields: 30,
  },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      cb(badRequest("Only JPEG, PNG or WebP images are allowed"));
      return;
    }
    cb(null, true);
  },
});

export const imagesUpload = (field) => upload.array(field, env.maxImagesPerUpload);

// Checks the file signature, not just the declared MIME type.
export const detectImageType = (buffer) => {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") {
    return "image/webp";
  }
  return null;
};

export const assertValidImages = (files = []) => {
  for (const file of files) {
    const detected = detectImageType(file.buffer);
    if (!detected) {
      throw badRequest(`"${file.originalname}" is not a valid JPEG, PNG or WebP image`);
    }
    file.mimetype = detected;
  }
};

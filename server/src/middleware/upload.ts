import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { AppError } from "../utils/errors";

export const UPLOAD_DIR = path.join(process.cwd(), "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, crypto.randomUUID() + ext);
  },
});

const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

export const uploadImages = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new AppError(400, "Дозволені лише зображення JPG, PNG або WebP"));
      return;
    }
    cb(null, true);
  },
});
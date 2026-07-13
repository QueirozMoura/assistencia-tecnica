import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── Destino: backend/uploads/produtos/ ───────────────────────────────────────
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, path.join(__dirname, "../../uploads/produtos"));
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${randomUUID()}${ext}`);
  },
});

// ── Validação de tipo ─────────────────────────────────────────────────────────
const allowedMimeTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function fileFilter(_req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedMimeTypes.has(file.mimetype) && allowedExtensions.has(ext)) {
    cb(null, true);
  } else {
    cb(
      Object.assign(
        new Error("Tipo de arquivo não permitido. Use JPEG, PNG ou WebP."),
        { statusCode: 400 }
      ),
      false
    );
  }
}

// ── Instância do multer ───────────────────────────────────────────────────────
export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
});

import { Router } from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { uploadMiddleware } from "../middlewares/upload.middleware.js";
import { uploadImagemProduto } from "../controllers/upload.controller.js";

const router = Router();

/**
 * POST /api/upload/produto
 * Protegido: requer token JWT + role ADMIN
 * Body: multipart/form-data com campo "imagem" (JPEG/PNG/WebP, máx 5MB)
 */
router.post(
  "/produto",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.single("imagem"),
  uploadImagemProduto
);

export default router;

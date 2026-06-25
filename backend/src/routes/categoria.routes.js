import { Router } from "express";
import * as categoriaController from "../controllers/categoria.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { categoriaSchema, categoriaUpdateSchema } from "../validators/categoria.validator.js";

const router = Router();

// GET /api/categorias — público
router.get("/", categoriaController.listarCategorias);

// GET /api/categorias/slug/:slug — público
router.get("/slug/:slug", categoriaController.buscarCategoriaPorSlug);

// GET /api/categorias/:id — público
router.get("/:id", categoriaController.buscarCategoriaPorId);

// POST /api/categorias — ADMIN
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validate(categoriaSchema),
  categoriaController.criarCategoria
);

// PUT /api/categorias/:id — ADMIN
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validate(categoriaUpdateSchema),
  categoriaController.atualizarCategoria
);

// DELETE /api/categorias/:id — ADMIN
router.delete("/:id", authMiddleware, adminMiddleware, categoriaController.deletarCategoria);

export default router;

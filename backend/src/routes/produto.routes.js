import { Router } from "express";
import * as produtoController from "../controllers/produto.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { produtoSchema, produtoUpdateSchema } from "../validators/produto.validator.js";

const router = Router();

// GET /api/produtos — público (com filtros, busca, paginação)
router.get("/", produtoController.listarProdutos);

// GET /api/produtos/destaque — público
router.get("/destaque", produtoController.buscarProdutosDestaque);

// GET /api/produtos/slug/:slug — público
router.get("/slug/:slug", produtoController.buscarProdutoPorSlug);

// GET /api/produtos/:id — público
router.get("/:id", produtoController.buscarProdutoPorId);

// GET /api/produtos/:id/relacionados — público
router.get("/:id/relacionados", produtoController.buscarProdutosRelacionados);

// POST /api/produtos — ADMIN
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validate(produtoSchema),
  produtoController.criarProduto
);

// PUT /api/produtos/:id — ADMIN
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validate(produtoUpdateSchema),
  produtoController.atualizarProduto
);

// DELETE /api/produtos/:id — ADMIN
router.delete("/:id", authMiddleware, adminMiddleware, produtoController.deletarProduto);

export default router;

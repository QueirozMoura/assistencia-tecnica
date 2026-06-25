import { Router } from "express";
import * as usuarioController from "../controllers/usuario.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  usuarioCreateSchema,
  usuarioUpdateSchema,
  alterarSenhaSchema,
} from "../validators/usuario.validator.js";

const router = Router();

// GET /api/usuarios — ADMIN
router.get("/", authMiddleware, adminMiddleware, usuarioController.listarUsuarios);

// GET /api/usuarios/:id — ADMIN
router.get("/:id", authMiddleware, adminMiddleware, usuarioController.buscarUsuarioPorId);

// POST /api/usuarios — ADMIN
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  validate(usuarioCreateSchema),
  usuarioController.criarUsuario
);

// PUT /api/usuarios/:id — ADMIN
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validate(usuarioUpdateSchema),
  usuarioController.atualizarUsuario
);

// PATCH /api/usuarios/:id/senha — ADMIN (ou próprio usuário)
router.patch(
  "/:id/senha",
  authMiddleware,
  validate(alterarSenhaSchema),
  usuarioController.alterarSenha
);

// DELETE /api/usuarios/:id — ADMIN
router.delete("/:id", authMiddleware, adminMiddleware, usuarioController.deletarUsuario);

export default router;

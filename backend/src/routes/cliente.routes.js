import { Router } from "express";
import * as clienteController from "../controllers/cliente.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { clienteSchema, clienteUpdateSchema } from "../validators/cliente.validator.js";

const router = Router();

// GET /api/clientes — ADMIN
router.get("/", authMiddleware, adminMiddleware, clienteController.listarClientes);

// GET /api/clientes/:id — ADMIN
router.get("/:id", authMiddleware, adminMiddleware, clienteController.buscarClientePorId);

// POST /api/clientes — público (cadastro no e-commerce / agendamento)
router.post("/", validate(clienteSchema), clienteController.criarCliente);

// PUT /api/clientes/:id — ADMIN
router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  validate(clienteUpdateSchema),
  clienteController.atualizarCliente
);

// DELETE /api/clientes/:id — ADMIN
router.delete("/:id", authMiddleware, adminMiddleware, clienteController.deletarCliente);

export default router;

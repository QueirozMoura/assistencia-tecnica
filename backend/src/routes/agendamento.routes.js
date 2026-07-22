import { Router } from "express";
import * as agendamentoController from "../controllers/agendamento.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { tecnicoMiddleware } from "../middlewares/tecnico.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { optionalClientAuthMiddleware } from "../middlewares/clientAuth.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import {
  agendamentoSchema,
  agendamentoUpdateSchema,
  agendamentoStatusSchema,
} from "../validators/agendamento.validator.js";

const router = Router();

// GET /api/agendamentos — ADMIN ou TECNICO
router.get("/", authMiddleware, tecnicoMiddleware, agendamentoController.listarAgendamentos);

// GET /api/agendamentos/:id — ADMIN ou TECNICO
router.get("/:id", authMiddleware, tecnicoMiddleware, agendamentoController.buscarAgendamentoPorId);

// POST /api/agendamentos — público (cliente agenda pelo site) com autenticação opcional
router.post(
  "/",
  optionalClientAuthMiddleware,
  validate(agendamentoSchema),
  agendamentoController.criarAgendamento
);

// PUT /api/agendamentos/:id — ADMIN ou TECNICO
router.put(
  "/:id",
  authMiddleware,
  tecnicoMiddleware,
  validate(agendamentoUpdateSchema),
  agendamentoController.atualizarAgendamento
);

// PATCH /api/agendamentos/:id/status — ADMIN ou TECNICO
router.patch(
  "/:id/status",
  authMiddleware,
  tecnicoMiddleware,
  validate(agendamentoStatusSchema),
  agendamentoController.atualizarStatusAgendamento
);

// DELETE /api/agendamentos/:id — apenas ADMIN
router.delete("/:id", authMiddleware, adminMiddleware, agendamentoController.deletarAgendamento);

export default router;

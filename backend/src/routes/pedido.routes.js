import { Router } from "express";
import * as pedidoController from "../controllers/pedido.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import { adminMiddleware } from "../middlewares/admin.middleware.js";
import { validate } from "../middlewares/validation.middleware.js";
import { pedidoSchema, pedidoStatusSchema } from "../validators/pedido.validator.js";

const router = Router();

// GET /api/pedidos — ADMIN
router.get("/", authMiddleware, adminMiddleware, pedidoController.listarPedidos);

// GET /api/pedidos/:id — ADMIN
router.get("/:id", authMiddleware, adminMiddleware, pedidoController.buscarPedidoPorId);

// POST /api/pedidos — público (checkout do e-commerce)
router.post("/", validate(pedidoSchema), pedidoController.criarPedido);

// POST /api/pedidos/com-pagamento — público (Mercado Pago)
router.post("/com-pagamento", validate(pedidoSchema), pedidoController.criarPedidoComPagamento);

// PATCH /api/pedidos/:id/status — ADMIN
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validate(pedidoStatusSchema),
  pedidoController.atualizarStatusPedido
);

// DELETE /api/pedidos/:id — ADMIN
router.delete("/:id", authMiddleware, adminMiddleware, pedidoController.deletarPedido);

export default router;

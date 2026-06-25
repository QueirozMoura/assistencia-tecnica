import { Router } from "express";
import authRoutes from "./auth.routes.js";
import categoriaRoutes from "./categoria.routes.js";
import produtoRoutes from "./produto.routes.js";
import clienteRoutes from "./cliente.routes.js";
import agendamentoRoutes from "./agendamento.routes.js";
import pedidoRoutes from "./pedido.routes.js";
import usuarioRoutes from "./usuario.routes.js";
import uploadRoutes from "./upload.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import clientAuthRoutes from "./clientAuth.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categorias", categoriaRoutes);
router.use("/produtos", produtoRoutes);
router.use("/clientes", clienteRoutes);
router.use("/agendamentos", agendamentoRoutes);
router.use("/pedidos", pedidoRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/upload", uploadRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/client-auth", clientAuthRoutes);

export default router;

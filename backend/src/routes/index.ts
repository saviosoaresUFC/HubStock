import { Router } from "express";
import { AuthController } from "../controllers/AuthController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { ProdutoController } from "../controllers/ProdutoController.js";
import { authorize } from "../middlewares/roleMiddleware.js";
import { UsuarioController } from "../controllers/UsuarioController.js";
import { VendaController } from "../controllers/VendaController.js";
import { ReportController } from "../controllers/ReportController.js";
import { RestauranteController } from "../controllers/RestauranteController.js";
import { validate } from "../middlewares/validateMiddleware.js";
import { loginSchema, usuarioCadastroSchema } from "../schemas/usuarioSchema.js";
import { MesaController } from "../controllers/MesaController.js";
import { produtoSchema, updateStockSchema } from "../schemas/produtoSchema.js";
import { vendaItemSchema } from "../schemas/vendaSchema.js";
import { publicRegisterSchema } from "../schemas/restauranteSchema.js";

const routes = Router();

// AUTENTICAÇÃO
routes.post("/login", validate(loginSchema), AuthController.login);

routes.post("/public/register", validate(publicRegisterSchema), AuthController.register);


// RESTAURANTES
routes.get(
    "/restaurantes",
    authMiddleware,
    authorize(['SUPERADMINISTRADOR']),
    RestauranteController.listAll
);
routes.get(
    "/restaurantes/:id",
    authMiddleware,
    authorize(['SUPERADMINISTRADOR']),
    RestauranteController.show
);


// USUÁRIOS
routes.post(
    "/usuarios",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    validate(usuarioCadastroSchema),
    UsuarioController.create
);
routes.get(
    "/usuarios",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    UsuarioController.list
);
routes.put(
    "/usuarios/:id",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    UsuarioController.update
);
routes.patch(
    "/usuarios/:id/role",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    UsuarioController.updateRole
);
routes.delete(
    "/usuarios/:id",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    UsuarioController.delete
);
routes.get(
    "/usuarios-restaurante",
     authMiddleware,
     authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
     UsuarioController.listByRestaurante,
);


// PRODUTOS
routes.get(
    "/produtos",
    authMiddleware,
    ProdutoController.list
);
routes.get(
    "/produtos/:id",
    authMiddleware,
    ProdutoController.getById
);
routes.post(
    "/produtos",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    validate(produtoSchema),
    ProdutoController.create
);
routes.put(
    "/produtos/:id",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    validate(produtoSchema),
    ProdutoController.update
);
routes.delete(
    "/produtos/:id",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    ProdutoController.delete
);
routes.patch(
    "/produtos/:id/estoque",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    validate(updateStockSchema),
    ProdutoController.updateStock
);


// VENDAS
routes.post(
    "/vendas/adicionar-item",
    authMiddleware,
    validate(vendaItemSchema),
    VendaController.adicionarItem
);
routes.post(
    "/vendas/remover-item",
    authMiddleware,
    validate(vendaItemSchema),
    VendaController.removerItem
);
routes.post(
    "/vendas/finalizar/:mesaId",
    authMiddleware,
    VendaController.finalizarVenda
);


// RELATÓRIOS
routes.get(
    "/relatorios",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    ReportController.loadReports
);
routes.get(
    "/relatorios/resumo",
    authMiddleware,
    authorize(['ADMINISTRADOR', 'SUPERADMINISTRADOR']),
    ReportController.getSummary
);
routes.get(
    "/relatorios/restaurante/:restId",
    authMiddleware,
    authorize(['SUPERADMINISTRADOR']),
    ReportController.getRestaurantBI
);


// MESAS
routes.get(
    "/mesas",
    authMiddleware,
    MesaController.listByRestaurante
);
routes.get(
    "/mesas/:mesaId/pedido-ativo",
    authMiddleware,
    MesaController.getPedidoAtivo
);

export default routes;
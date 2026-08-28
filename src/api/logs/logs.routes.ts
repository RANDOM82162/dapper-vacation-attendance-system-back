import express from "express";
import * as controller from "./logsController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { PERMISSIONS, ROLES } from "../../middleware/auth.enum";

const router = express.Router();

// 1. Ruta ADMIN (Ver todo)
router.get("/admin/all",
    AuthMiddleware.verifyToken,
    AuthMiddleware.hasPermissionOrRole(PERMISSIONS.LOG_READ, [ROLES.ADMIN]),
    controller.getAllLogsAdminController);

// 2. Ruta DESPACHO (Ver logs de su contexto)
router.get("/despacho/:uid",
    AuthMiddleware.verifyToken,
    AuthMiddleware.hasPermissionOrRole(PERMISSIONS.LOG_READ, [ROLES.ADMIN, ROLES.DESPACHO]),
    AuthMiddleware.canManageByUid,
    controller.getLogsDespachoController);

// 3. Ruta CONTRIBUYENTE (Ver sus logs)
router.get("/contribuyente/:uid",
    AuthMiddleware.verifyToken,
    AuthMiddleware.hasPermissionOrRole(PERMISSIONS.LOG_READ, [ROLES.ADMIN, ROLES.DESPACHO, ROLES.CONTRIBUYENTE]),
    AuthMiddleware.canManageByUid,
    controller.getLogsContribuyenteController);

export default router;
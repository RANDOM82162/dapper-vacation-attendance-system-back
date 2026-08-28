import express from "express";
import * as controller from "./notificacionesController";
import { AuthMiddleware } from "../../middleware/auth.middleware";

const router = express.Router();

router.get("/",
    AuthMiddleware.verifyToken,
    controller.getMisNotificacionesController);

router.get("/ultimas",
    AuthMiddleware.verifyToken,
    controller.getUltimasNotificacionesController);

router.patch("/marcar-leida/:id",
    AuthMiddleware.verifyToken,
    controller.marcarLeidaController);

router.patch("/marcar-todas-leidas",
    AuthMiddleware.verifyToken,
    controller.marcarTodasLeidasController);

export default router;
import express from "express";
import * as controller from "./recursoController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { getRecursoById } from "./recursoModel";

const router = express.Router();

router.get("/get-all", AuthMiddleware.verifyToken, controller.getRecursosController);

router.get("/get-by-padre/:uid", AuthMiddleware.verifyToken, AuthMiddleware.canManageByUid, controller.getRecursosController);

router.post("/create", AuthMiddleware.verifyToken, controller.createRecursoController);

router.put("/update/:id", AuthMiddleware.verifyToken, AuthMiddleware.canManageResource(getRecursoById, "id_padre"), controller.updateRecursoController);

router.delete("/delete/:id", AuthMiddleware.verifyToken, AuthMiddleware.canManageResource(getRecursoById, "id_padre"), controller.deleteRecursoController);

export default router;

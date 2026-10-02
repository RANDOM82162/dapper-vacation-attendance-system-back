import express from "express";
import * as vacationBalancesController from "./vacationBalancesController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { ROLES } from "../../middleware/auth.enum";

const router = express.Router();

router.get("/get-all", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationBalancesController.getVacationBalancesController);
router.get("/get-by-id/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationBalancesController.getVacationBalanceByIdController);
router.post("/create", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.ADMIN]), vacationBalancesController.createVacationBalanceController);
router.put("/update/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.ADMIN]), vacationBalancesController.updateVacationBalanceController);
router.delete("/delete/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.ADMIN]), vacationBalancesController.deleteVacationBalanceController);

export default router;

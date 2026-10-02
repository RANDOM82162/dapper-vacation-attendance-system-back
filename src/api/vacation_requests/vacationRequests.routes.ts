import express from "express";
import * as vacationRequestsController from "./vacationRequestsController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { ROLES } from "../../middleware/auth.enum";

const router = express.Router();

router.get("/get-all", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationRequestsController.getVacationRequestsController);
router.get("/get-by-id/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationRequestsController.getVacationRequestByIdController);
router.post("/create", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO]), vacationRequestsController.createVacationRequestController);
router.put("/update/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationRequestsController.updateVacationRequestController);
router.put("/approve/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationRequestsController.approveVacationRequestController);
router.put("/reject/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationRequestsController.rejectVacationRequestController);
router.put("/request-changes/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), vacationRequestsController.requestVacationChangesController);
router.put("/cancel/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO]), vacationRequestsController.cancelVacationRequestController);
router.delete("/delete/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.ADMIN]), vacationRequestsController.deleteVacationRequestController);

export default router;

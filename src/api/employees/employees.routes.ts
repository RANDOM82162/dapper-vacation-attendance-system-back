import express from "express";
import * as employeesController from "./employeesController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { ROLES } from "../../middleware/auth.enum";

const router = express.Router();

router.get(
  "/me",
  AuthMiddleware.verifyToken,
  employeesController.getCurrentEmployeeController,
);

router.get(
  "/get-all",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole([ROLES.ADMIN, ROLES.JEFE_DIRECTOR]),
  employeesController.getEmployeesController,
);

router.get(
  "/get-by-id/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole([ROLES.ADMIN]),
  employeesController.getEmployeeByIdController,
);

router.get(
  "/get-by-uid/:uid",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole([ROLES.ADMIN]),
  employeesController.getEmployeeByUidController,
);

router.post(
  "/create",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole([ROLES.ADMIN]),
  employeesController.createEmployeeController,
);

router.put(
  "/update/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole([ROLES.ADMIN]),
  employeesController.updateEmployeeController,
);

router.delete(
  "/delete/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole([ROLES.ADMIN]),
  employeesController.deleteEmployeeController,
);

export default router;

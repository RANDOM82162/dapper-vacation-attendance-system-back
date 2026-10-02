import express from "express";
import bodyParser from "body-parser";
import * as attendanceRecordsController from "./attendanceRecordsController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { ROLES } from "../../middleware/auth.enum";

const router = express.Router();

router.get("/get-all", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), attendanceRecordsController.getAttendanceRecordsController);
router.get("/imports", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), attendanceRecordsController.getAttendanceImportsController);
router.get("/settings", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), attendanceRecordsController.getAttendanceSettingsController);
router.put("/settings", AuthMiddleware.verifyToken, AuthMiddleware.requireRoleOrDepartment([ROLES.JEFE_DIRECTOR, ROLES.ADMIN], "Direccion"), attendanceRecordsController.updateAttendanceSettingsController);
router.post(
  "/import-weeks",
  AuthMiddleware.verifyToken,
  AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]),
  bodyParser.json({ limit: "70mb" }),
  attendanceRecordsController.importAttendanceRecordsController,
);
router.put("/records/:id/permission", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), attendanceRecordsController.updateAttendancePermissionController);
router.put("/records/:id/forgiveness", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), attendanceRecordsController.updateAttendanceForgivenessController);
router.delete("/imports/:id", AuthMiddleware.verifyToken, AuthMiddleware.requireRole([ROLES.EMPLEADO, ROLES.JEFE_DIRECTOR, ROLES.ADMIN]), attendanceRecordsController.deleteAttendanceImportController);

export default router;

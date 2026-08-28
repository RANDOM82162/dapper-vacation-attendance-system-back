import express from "express";
import * as adminsController from "./adminsController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { PERMISSIONS, ROLES } from "../../middleware/auth.enum";

const router = express.Router();

router.get(
  "/get-all",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.ADMIN_READ, [ROLES.ADMIN]),
  adminsController.getAdminsController
);
router.get(
  "/get-by-uid/:uid",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.ADMIN_READ, [ROLES.ADMIN]),
  adminsController.getAdminByUidController
);
router.get(
  "/get-by-id/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.ADMIN_READ, [ROLES.ADMIN]),
  adminsController.getAdminByIdController
);
router.post(
  "/create",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.ADMIN_CREATE, [ROLES.ADMIN]),
  adminsController.createAdminController
);
router.put(
  "/update/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.ADMIN_READ, [ROLES.ADMIN]),
  adminsController.updateAdminController
);
router.delete(
  "/delete/:uid",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.ADMIN_DELETE, [ROLES.ADMIN]),
  adminsController.deleteAdminController
);
router.put(
  "/update-password/:uid",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.ADMIN_UPDATE, [ROLES.ADMIN]),
  adminsController.updatePasswordController
);

export default router;

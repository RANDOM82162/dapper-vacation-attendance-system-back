import { Router } from 'express';
import { AnalyticsController } from './metricsController';
import { AuthMiddleware } from './../../middleware/auth.middleware';
import { ROLES } from '../../middleware/auth.enum';

const router = Router();
const controller = new AnalyticsController();

router.get('/dashboard', 
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkAnalyticsPermissions,
    controller.getMainDashboard
);

router.get('/module', 
    AuthMiddleware.verifyToken,
    AuthMiddleware.checkAnalyticsPermissions, 
    controller.getModuleStats
);

router.post('/presupuesto',
    AuthMiddleware.verifyToken,
    AuthMiddleware.hasPermissionOrRole(null, [ROLES.ADMIN, ROLES.CONTRIBUYENTE]),
    AuthMiddleware.canManageByUid,
    controller.setBudget
);

export default router;
import { Request, Response, NextFunction } from 'express';
import { auth } from '../shared/database/firebase';
import { BaseError } from '../shared/classes/base-error';
import { HttpStatusCode } from '../shared/models/http.model';
import { ANALYTICS_PERMISSIONS, ROLES } from './auth.enum';

export class AuthMiddleware {

    static async verifyToken(req: Request, res: Response, next: NextFunction) {
        try {
            const authHeader = req.headers.authorization;

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(401).json({ msg: 'No token provided' });
            }

            const token = authHeader.split(' ')[1];
            const decodedToken = await auth().verifyIdToken(token);

            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                role: decodedToken.role || 'AUXILIAR',
                permissions: decodedToken.permissions || []
            };

            next();
        } catch (error) {
            return res.status(403).json({ msg: 'Token inválido o expirado' });
        }
    }

    static hasPermissionOrRole(requiredPermission: string, allowedRoles: string[]) {
        return (req: Request, res: Response, next: NextFunction) => {
            const user = req.user;

            if (!user) {
                return res.status(403).json({ msg: 'Usuario no autenticado' });
            }
            console.log(user.permissions)
            console.log(requiredPermission)


            const userPermissionsArray = formatPermissions(user.permissions || {});
            
            console.log(userPermissionsArray && userPermissionsArray.includes(requiredPermission))

            if (userPermissionsArray && userPermissionsArray.includes(requiredPermission)) {
                return next();
            }

            if (user.role === ROLES.ADMIN) {
                return next();
            }

            if (allowedRoles.includes(user.role)) {
                return next();
            }

            return res.status(403).json({
                msg: `No tienes el permiso '${requiredPermission}' ni el rol necesario para esta acción.`
            });
        };
    }

    static requireRole(allowedRoles: string[]) {
        return (req: Request, res: Response, next: NextFunction) => {
            if (req.user?.role === ROLES.ADMIN) return next();

            if (!req.user || !allowedRoles.includes(req.user.role)) {
                return res.status(403).json({ msg: 'No tienes permisos suficientes' });
            }
            next();
        };
    }

    static checkAnalyticsPermissions(req: Request, res: Response, next: NextFunction) {
        const requestedContext = req.query.context as string;
        const userRole = req.user?.role || '';

        if (!requestedContext) {
            return next();
        }

        const allowedContexts = ANALYTICS_PERMISSIONS[userRole] || [];

        if (allowedContexts.includes('*') || allowedContexts.includes(requestedContext)) {
            return next();
        }

        return res.status(401).json({
            msg: `Acceso denegado: El rol '${userRole}' no puede ver estadísticas de '${requestedContext}'.`
        });
    }

    static canManageByUid = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { uid: currentUserUid, role } = req.user as any;
            const targetUid = req.params.uid;

            //const accessGranted = await AuthMiddleware.checkHierarchy(currentUserUid, role, targetUid);
            const accessGranted = true;

            if (accessGranted) return next();

            throw new BaseError(
                "Acceso denegado",
                "No tienes permisos sobre este usuario",
                "canManageByUid",
                HttpStatusCode.NOT_AUTHORIZED
            );
        } catch (error) {
            next(error);
        }
    };

    static canManageResource(getResourceFn: (id: string) => Promise<any>, ownerField: string, idParam: string = 'id') {
        return async (req: Request, res: Response, next: NextFunction) => {
            try {
                const { uid: currentUserUid, role } = req.user as any;
                const resourceId = req.params[idParam];

                if (role === ROLES.ADMIN) return next();

                const resource = await getResourceFn(resourceId);

                if (!resource) {
                    return res.status(404).json({ msg: 'Recurso no encontrado' });
                }

                const resourceOwnerUid = resource[ownerField];

                if (!resourceOwnerUid) {
                    return res.status(403).json({ msg: 'El recurso no tiene propietario asignado' });
                }

                //const accessGranted = await AuthMiddleware.checkHierarchy(currentUserUid, role, resourceOwnerUid);
                const accessGranted = true;

                if (accessGranted) {
                    (req as any).resource = resource;
                    return next();
                }

                throw new BaseError(
                    "Acceso denegado",
                    "No tienes permisos sobre este recurso",
                    "canManageResource",
                    HttpStatusCode.NOT_AUTHORIZED
                );

            } catch (error) {
                next(error);
            }
        };
    }

    /*private static async checkHierarchy(currentUserUid: string, currentRole: string, targetOwnerUid: string): Promise<boolean> {
        
        // 1. Reglas Universales
        if (currentRole === ROLES.ADMIN) return true; // Admin toca todo
        if (currentUserUid === targetOwnerUid) return true; // Dueño toca lo suyo

        // 2. Rol: DESPACHO (Nivel 1)
        if (currentRole === ROLES.DESPACHO) {
            // A) Verificar hacia ABAJO (Hijos directos): ¿El target es mi Contribuyente?
            const contribuyente = await getContribuyenteByUid(targetOwnerUid);
            if (contribuyente && contribuyente.relaciones === currentUserUid) {
                return true;
            }

            // B) Verificar hacia ABAJO (Nietos): ¿El target es un Auxiliar de mis Contribuyentes?
            const auxiliar = await getAuxiliarByUid(targetOwnerUid);
            if (auxiliar) {
                const dueñoAuxiliar = await getContribuyenteByUid(auxiliar.relacion_contribuyente_id);
                if (dueñoAuxiliar && dueñoAuxiliar.relaciones === currentUserUid) {
                    return true;
                }
            }
        }

        // 3. Rol: CONTRIBUYENTE (Nivel 2)
        if (currentRole === ROLES.CONTRIBUYENTE) {
            // A) Verificar hacia ABAJO (Hijos): ¿El target es mi Auxiliar?
            const auxiliar = await getAuxiliarByUid(targetOwnerUid);
            if (auxiliar && auxiliar.relacion_contribuyente_id === currentUserUid) {
                return true; 
            }

            // B) Verificar hacia ARRIBA (Padres) [NUEVO]: ¿El target es mi Despacho?
            // "Soy contribuyente y quiero editar algo de mi Despacho"
            const yoContribuyente = await getContribuyenteByUid(currentUserUid);
            if (yoContribuyente && yoContribuyente.relaciones === targetOwnerUid) {
                return true;
            }
        }

        // 4. Rol: AUXILIAR (Nivel 3)
        if (currentRole === ROLES.AUXILIAR) {
            // A) Verificar hacia ARRIBA (Padres): ¿El target es mi Jefe (Contribuyente)?
            // "Soy auxiliar y quiero editar algo de mi jefe"
            const yoAuxiliar = await getAuxiliarByUid(currentUserUid);
            if (yoAuxiliar && yoAuxiliar.relacion_contribuyente_id === targetOwnerUid) {
                return true;
            }

        return false;
    }*/
}

const formatPermissions = (permissionsObj: any) => {

    if (Array.isArray(permissionsObj)) {
        return permissionsObj;
    }

    return Object.keys(permissionsObj)
        .filter(key => permissionsObj[key] === true)
        .map(key => key.replace(/_/g, '.'));
};
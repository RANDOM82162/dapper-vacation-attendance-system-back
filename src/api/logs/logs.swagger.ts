/**
 * @swagger
 * components:
 *   schemas:
 *     LogActividad:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         fecha:
 *           type: string
 *           format: date-time
 *         descripcion:
 *           type: string
 *         id_despacho:
 *           type: string
 *         nombre_despacho:
 *           type: string
 *         id_contribuyente:
 *           type: string
 *         nombre_contribuyente:
 *           type: string
 *         usuario_id:
 *           type: string
 *         nombre_usuario:
 *           type: string
 *         rol_usuario:
 *           type: string
 *         tipo_accion:
 *           type: string
 *         entidad_afectada:
 *           type: string
 *         creationDateTS:
 *           type: number
 *         usuario_detalle:
 *           type: object
 *         despacho_detalle:
 *           type: object
 *         contribuyente_detalle:
 *           type: object
 */

/**
 * @swagger
 * tags:
 *   name: Logs
 *   description: Bitácora de actividades del sistema
 */

/**
 * @swagger
 * /api/log/admin/all:
 *   get:
 *     summary: Obtener todos los logs del sistema (Admin)
 *     description: Requiere rol ADMIN o permiso LOG_READ.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: idDespacho
 *         schema:
 *           type: string
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bitácora completa obtenida
 */

/**
 * @swagger
 * /api/log/despacho/{despachoId}:
 *   get:
 *     summary: Obtener logs asociados a un despacho
 *     description: Requiere rol ADMIN, DESPACHO o permiso LOG_READ.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: despachoId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: rol
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bitácora del despacho obtenida
 */

/**
 * @swagger
 * /api/log/contribuyente/{contribuyenteId}:
 *   get:
 *     summary: Obtener logs de un contribuyente
 *     description: Requiere rol ADMIN, DESPACHO, CONTRIBUYENTE o permiso LOG_READ.
 *     tags: [Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: contribuyenteId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Historial de actividad obtenido
 */

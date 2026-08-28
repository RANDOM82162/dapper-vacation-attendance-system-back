/**
 * @swagger
 * components:
 *   schemas:
 *     TipoNotificacion:
 *       type: string
 *       enum:
 *         - INFO
 *         - ELIMINAR
 *         - SUCCESS
 *         - ERROR
 *     CategoriaNotificacion:
 *       type: string
 *       enum:
 *         - FISCAL
 *         - SISTEMA
 *         - GENERAL
 *     Notificacion:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         usuario_id:
 *           type: string
 *         titulo:
 *           type: string
 *         mensaje:
 *           type: string
 *         tipo:
 *           $ref: '#/components/schemas/TipoNotificacion'
 *         categoria:
 *           $ref: '#/components/schemas/CategoriaNotificacion'
 *         leido:
 *           type: boolean
 *         fecha:
 *           type: string
 *           format: date-time
 *         link_accion:
 *           type: string
 *         creationDateTS:
 *           type: number
 *     CreateNotificacionDto:
 *       type: object
 *       required:
 *         - usuario_id
 *         - titulo
 *         - mensaje
 *         - tipo
 *       properties:
 *         usuario_id:
 *           type: string
 *         titulo:
 *           type: string
 *         mensaje:
 *           type: string
 *         tipo:
 *           $ref: '#/components/schemas/TipoNotificacion'
 *         categoria:
 *           $ref: '#/components/schemas/CategoriaNotificacion'
 *         link_accion:
 *           type: string
 *         enviarPush:
 *           type: boolean
 *         fcmToken:
 *           type: string
 *     NotificacionesResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Notificacion'
 *         meta:
 *           type: object
 *           properties:
 *             totalItems:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             currentPage:
 *               type: integer
 *             itemsPerPage:
 *               type: integer
 *             noLeidasCount:
 *               type: integer
 */

/**
 * @swagger
 * tags:
 *   name: Notificaciones
 *   description: Gestión de notificaciones y avisos
 */

/**
 * @swagger
 * /api/notificaciones/mis-notificaciones:
 *   get:
 *     summary: Obtener mis notificaciones
 *     description: Requiere autenticación. Devuelve las notificaciones del usuario autenticado.
 *     tags: [Notificaciones]
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
 *           default: 10
 *       - in: query
 *         name: categoria
 *         schema:
 *           $ref: '#/components/schemas/CategoriaNotificacion'
 *       - in: query
 *         name: soloNoLeidas
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Lista de notificaciones obtenida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificacionesResponse'
 */

/**
 * @swagger
 * /api/notificaciones/create:
 *   post:
 *     summary: Crear una nueva notificación
 *     description: Requiere rol ADMIN o permiso NOTIFICACION_CREATE.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificacionDto'
 *     responses:
 *       200:
 *         description: Notificación enviada
 */

/**
 * @swagger
 * /api/notificaciones/marcar-leida/{id}:
 *   patch:
 *     summary: Marcar una notificación como leída
 *     description: Requiere autenticación.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificación marcada como leída
 */

/**
 * @swagger
 * /api/notificaciones/marcar-todas-leidas:
 *   patch:
 *     summary: Marcar todas mis notificaciones como leídas
 *     description: Requiere autenticación.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Todas marcadas como leídas
 */

/**
 * @swagger
 * /api/notificaciones/delete/{id}:
 *   delete:
 *     summary: Eliminar una notificación
 *     description: Requiere autenticación.
 *     tags: [Notificaciones]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notificación eliminada
 */

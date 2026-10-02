/**
 * @swagger
 * tags:
 *   name: VacationRequests
 *   description: API para solicitudes de vacaciones
 */

/**
 * @swagger
 * /api/vacation-requests/get-all:
 *   get:
 *     summary: Obtener solicitudes de vacaciones
 *     tags: [VacationRequests]
 *     parameters:
 *       - in: query
 *         name: employeeId
 *         schema:
 *           type: string
 *       - in: query
 *         name: employeeName
 *         schema:
 *           type: string
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de solicitudes
 */

/**
 * @swagger
 * /api/vacation-requests/create:
 *   post:
 *     summary: Crear solicitud de vacaciones
 *     tags: [VacationRequests]
 *     responses:
 *       200:
 *         description: Solicitud creada
 */

/**
 * @swagger
 * /api/vacation-requests/approve/{id}:
 *   put:
 *     summary: Aprobar solicitud
 *     tags: [VacationRequests]
 *     responses:
 *       200:
 *         description: Solicitud aprobada
 */

/**
 * @swagger
 * /api/vacation-requests/reject/{id}:
 *   put:
 *     summary: Rechazar solicitud
 *     tags: [VacationRequests]
 *     responses:
 *       200:
 *         description: Solicitud rechazada
 */

/**
 * @swagger
 * /api/vacation-requests/request-changes/{id}:
 *   put:
 *     summary: Solicitar cambios
 *     tags: [VacationRequests]
 *     responses:
 *       200:
 *         description: Cambios solicitados
 */

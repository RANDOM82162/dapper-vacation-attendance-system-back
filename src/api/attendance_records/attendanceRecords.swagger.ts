/**
 * @swagger
 * tags:
 *   name: AttendanceRecords
 *   description: Registros, importaciones y configuración de asistencia
 */

/**
 * @swagger
 * /api/attendance-records/get-all:
 *   get:
 *     summary: Consultar registros de asistencia
 *     tags: [AttendanceRecords]
 *     responses:
 *       200:
 *         description: Registros paginados
 */

/**
 * @swagger
 * /api/attendance-records/imports:
 *   get:
 *     summary: Consultar historial de cargas
 *     tags: [AttendanceRecords]
 *     responses:
 *       200:
 *         description: Cargas paginadas
 */

/**
 * @swagger
 * /api/attendance-records/settings:
 *   get:
 *     summary: Consultar regla de asistencia
 *     tags: [AttendanceRecords]
 *     responses:
 *       200:
 *         description: Regla vigente
 *   put:
 *     summary: Actualizar regla de asistencia
 *     tags: [AttendanceRecords]
 *     responses:
 *       200:
 *         description: Regla actualizada
 */

/**
 * @swagger
 * /api/attendance-records/import-weeks:
 *   post:
 *     summary: Guardar semanas procesadas desde un Excel
 *     tags: [AttendanceRecords]
 *     responses:
 *       200:
 *         description: Resumen de semanas insertadas y omitidas
 */

/**
 * @swagger
 * /api/attendance-records/records/{id}/permission:
 *   put:
 *     summary: Registrar o retirar un permiso de asistencia
 *     tags: [AttendanceRecords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro actualizado
 */

/**
 * @swagger
 * /api/attendance-records/records/{id}/forgiveness:
 *   put:
 *     summary: Perdonar observaciones de asistencia
 *     tags: [AttendanceRecords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Registro actualizado
 */

/**
 * @swagger
 * /api/attendance-records/imports/{id}:
 *   delete:
 *     summary: Eliminar una carga de asistencia
 *     tags: [AttendanceRecords]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Carga eliminada
 */

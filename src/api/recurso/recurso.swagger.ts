/**
 * @swagger
 * components:
 *   schemas:
 *     EstadoRecurso:
 *       type: string
 *       enum:
 *         - ACTIVO
 *         - INACTIVO
 *         - PROCESANDO
 *     SubDocumento:
 *       type: object
 *       properties:
 *         campo_interno:
 *           type: string
 *         valor:
 *           type: number
 *     RecursoBase:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         id_padre:
 *           type: string
 *         folio:
 *           type: string
 *         estado:
 *           $ref: '#/components/schemas/EstadoRecurso'
 *         detalles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubDocumento'
 *         monto_total:
 *           type: number
 *         es_restringido:
 *           type: boolean
 *         creationDateTS:
 *           type: number
 *     CreateRecursoRequest:
 *       type: object
 *       required:
 *         - id_padre
 *         - estado
 *         - monto_total
 *         - es_restringido
 *       properties:
 *         id_padre:
 *           type: string
 *         folio:
 *           type: string
 *         estado:
 *           $ref: '#/components/schemas/EstadoRecurso'
 *         detalles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubDocumento'
 *         monto_total:
 *           type: number
 *         es_restringido:
 *           type: boolean
 *         parametro_temporal_frontend:
 *           type: string
 *     UpdateRecursoRequest:
 *       type: object
 *       properties:
 *         folio:
 *           type: string
 *         estado:
 *           $ref: '#/components/schemas/EstadoRecurso'
 *         detalles:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/SubDocumento'
 *         monto_total:
 *           type: number
 *         es_restringido:
 *           type: boolean
 *         parametro_temporal_frontend:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Recurso
 *   description: API para la gestión de recursos
 */

/**
 * @swagger
 * /api/recurso/get-all:
 *   get:
 *     summary: Obtener todos los recursos
 *     tags: [Recurso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: id_padre
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           $ref: '#/components/schemas/EstadoRecurso'
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
 *         name: fechaInicio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de recursos
 */

/**
 * @swagger
 * /api/recurso/get-by-padre/{uid}:
 *   get:
 *     summary: Obtener recursos por ID de padre
 *     tags: [Recurso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: estado
 *         schema:
 *           $ref: '#/components/schemas/EstadoRecurso'
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
 *         name: fechaInicio
 *         schema:
 *           type: integer
 *       - in: query
 *         name: fechaFin
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de recursos del padre
 */

/**
 * @swagger
 * /api/recurso/create:
 *   post:
 *     summary: Crear un recurso
 *     tags: [Recurso]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecursoRequest'
 *     responses:
 *       200:
 *         description: Recurso creado
 */

/**
 * @swagger
 * /api/recurso/update/{id}:
 *   put:
 *     summary: Actualizar un recurso
 *     tags: [Recurso]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateRecursoRequest'
 *     responses:
 *       200:
 *         description: Recurso actualizado
 */

/**
 * @swagger
 * /api/recurso/delete/{id}:
 *   delete:
 *     summary: Eliminar un recurso
 *     tags: [Recurso]
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
 *         description: Recurso eliminado
 */

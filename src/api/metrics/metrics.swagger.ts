/**
 * @swagger
 * components:
 *   schemas:
 *     MetricData:
 *       type: object
 *       properties:
 *         total:
 *           type: number
 *         variation:
 *           type: number
 *         trend:
 *           type: string
 *           enum:
 *             - up
 *             - down
 *             - neutral
 *     AnalyticsResponse:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *         kpis:
 *           type: object
 *           properties:
 *             count:
 *               $ref: '#/components/schemas/MetricData'
 *             amount:
 *               : '#/components/schemas/MetricData'
 *         chart:
 *           type: object
 *           properties:
 *             labels:
 *               type: array
 *               items:
 *                 type: string
 *             dataset:
 *               type: array
 *               items:
 *                 type: number
 *     MainDashboardCard:
 *       type: object
 *       properties:
 *         label:
 *           type: string
 *         value:
 *           type: number
 *         percentage:
 *           type: number
 *         isPositive:
 *           type: boolean
 *         isCurrency:
 *           type: boolean
 *     MainDashboardResponse:
 *       type: object
 *       properties:
 *         mode:
 *           type: string
 *           enum:
 *             - week
 *             - month
 *         cards:
 *           type: array
 *           items:
 *             : '#/components/schemas/MainDashboardCard'
 *         chart:
 *           type: object
 *           properties:
 *             labels:
 *               type: array
 *               items:
 *                 type: string
 *             series:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   label:
 *                     type: string
 *                   data:
 *                     type: array
 *                     items:
 *                       type: number
 *     SetBudgetRequest:
 *       type: object
 *       required:
 *         - year
 *         - month
 *         - amount
 *       properties:
 *         companyId:
 *           type: string
 *           description: Opcional para contribuyente (toma su ID), requerido para Admin si gestiona otro.
 *         year:
 *           type: integer
 *         month:
 *           type: integer
 *         amount:
 *           type: number
 */

/**
 * @swagger
 * tags:
 *   name: Metrics
 *   description: Métricas y estadísticas del sistema
 */

/**
 * @swagger
 * /api/metrics/dashboard:
 *   get:
 *     summary: Obtener estadísticas del dashboard principal
 *     description: Requiere autenticación y permisos de análisis (checkAnalyticsPermissions). Devuelve KPIs y datos para gráficas generales del despacho.
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [week, month]
 *           default: month
 *         description: Modo de visualización (semanal o mensual)
 *     responses:
 *       200:
 *         description: Datos del dashboard obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               : '#/components/schemas/MainDashboardResponse'
 *       500:
 *         description: Error al cargar el dashboard
 */

/**
 * @swagger
 * /api/metrics/module:
 *   get:
 *     summary: Obtener estadísticas específicas de un módulo
 *     description: Requiere autenticación y permisos de análisis (checkAnalyticsPermissions). Devuelve métricas detalladas para un contexto específico (ej. CLIENTES, VENTAS).
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: context
 *         required: true
 *         schema:
 *           type: string
 *         description: Contexto de las métricas (ej. CLIENTES, INGRESOS, EGRESOS, PRODUCTOS, PRESUPUESTOS)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Año de consulta (por defecto año actual)
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *         description: Mes de consulta (1-12)
 *       - in: query
 *         name: week
 *         schema:
 *           type: integer
 *         description: Semana de consulta (1-52)
 *     responses:
 *       200:
 *         description: Estadísticas del módulo obtenidas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               : '#/components/schemas/AnalyticsResponse'
 *       400:
 *         description: Contexto requerido
 *       500:
 *         description: Error al obtener analíticas
 */

/**
 * @swagger
 * /api/metrics/presupuesto:
 *   post:
 *     summary: Definir presupuesto mensual
 *     description: Requiere autenticación y rol ADMIN o CONTRIBUYENTE. Define el presupuesto para un mes y lo distribuye automáticamente en semanas y días.
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SetBudgetRequest'
 *     responses:
 *       200:
 *         description: Presupuesto actualizado
 */

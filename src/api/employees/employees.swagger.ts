/**
 * @swagger
 * components:
 *   schemas:
 *     EmployeeRole:
 *       type: string
 *       enum:
 *         - Empleado
 *         - Jefe/Director
 *         - Administrador
 *     EmployeeStatus:
 *       type: string
 *       enum:
 *         - ACTIVO
 *         - INACTIVO
 *     Employee:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         uid:
 *           type: string
 *         employeeNumber:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         department:
 *           type: string
 *         role:
 *           $ref: '#/components/schemas/EmployeeRole'
 *         managerId:
 *           type: string
 *         managerName:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/EmployeeStatus'
 *         creationDateTS:
 *           type: number
 *         updateDateTS:
 *           type: number
 *     CreateEmployeeRequest:
 *       type: object
 *       required:
 *         - name
 *         - department
 *         - role
 *       properties:
 *         uid:
 *           type: string
 *         employeeNumber:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         department:
 *           type: string
 *         role:
 *           $ref: '#/components/schemas/EmployeeRole'
 *         managerId:
 *           type: string
 *         managerName:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/EmployeeStatus'
 *     UpdateEmployeeRequest:
 *       type: object
 *       properties:
 *         uid:
 *           type: string
 *         employeeNumber:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         department:
 *           type: string
 *         role:
 *           $ref: '#/components/schemas/EmployeeRole'
 *         managerId:
 *           type: string
 *         managerName:
 *           type: string
 *         status:
 *           $ref: '#/components/schemas/EmployeeStatus'
 */

/**
 * @swagger
 * tags:
 *   name: Employees
 *   description: API para la gestión de empleados
 */

/**
 * @swagger
 * /api/employees/get-all:
 *   get:
 *     summary: Obtener empleados
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           $ref: '#/components/schemas/EmployeeRole'
 *       - in: query
 *         name: managerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           $ref: '#/components/schemas/EmployeeStatus'
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
 *     responses:
 *       200:
 *         description: Lista de empleados
 */

/**
 * @swagger
 * /api/employees/get-by-id/{id}:
 *   get:
 *     summary: Obtener empleado por ID
 *     tags: [Employees]
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
 *         description: Empleado obtenido
 */

/**
 * @swagger
 * /api/employees/get-by-uid/{uid}:
 *   get:
 *     summary: Obtener empleado por UID de Firebase
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Empleado obtenido
 */

/**
 * @swagger
 * /api/employees/create:
 *   post:
 *     summary: Crear empleado
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmployeeRequest'
 *     responses:
 *       200:
 *         description: Empleado creado
 */

/**
 * @swagger
 * /api/employees/update/{id}:
 *   put:
 *     summary: Actualizar empleado
 *     tags: [Employees]
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
 *             $ref: '#/components/schemas/UpdateEmployeeRequest'
 *     responses:
 *       200:
 *         description: Empleado actualizado
 */

/**
 * @swagger
 * /api/employees/delete/{id}:
 *   delete:
 *     summary: Eliminar empleado
 *     tags: [Employees]
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
 *         description: Empleado eliminado
 */

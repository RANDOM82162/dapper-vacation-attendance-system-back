/**
 * @swagger
 * components:
 *   schemas:
 *     Admin:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID de MongoDB
 *         uid:
 *           type: string
 *           description: ID de Firebase
 *         name:
 *           type: string
 *           description: Nombre completo
 *         email:
 *           type: string
 *           description: Correo electrónico
 *         branches:
 *           type: array
 *           items:
 *             type: string
 *           description: Sucursales asignadas
 *         role:
 *           type: string
 *           description: Rol del usuario
 *         photoURL:
 *           type: string
 *           description: URL de la foto de perfil
 *         creationDateTS:
 *           type: number
 *           description: Timestamp de creación
 *     CreateAdminRequest:
 *       type: object
 *       properties:
 *         admin:
 *           type: object
 *           required:
 *             - name
 *             - email
 *             - password
 *             - role
 *           properties:
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             password:
 *               type: string
 *             branches:
 *               type: array
 *               items:
 *                 type: string
 *             role:
 *               type: string
 *             photoURL:
 *               type: string
 *     UpdateAdminRequest:
 *       type: object
 *       properties:
 *         admin:
 *           type: object
 *           properties:
 *             uid:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *             branches:
 *               type: array
 *               items:
 *                 type: string
 *             role:
 *               type: string
 *             photoURL:
 *               type: string
 *     UpdatePasswordRequest:
 *       type: object
 *       required:
 *         - password
 *       properties:
 *         password:
 *           type: string
 */

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Gestión de administradores del sistema
 */

/**
 * @swagger
 * /api/admin/get-all:
 *   get:
 *     summary: Obtener todos los administradores
 *     description: Requiere rol ADMIN o permiso ADMIN_READ.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de elementos por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda
 *     responses:
 *       200:
 *         description: Lista de administradores obtenida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Admin'
 */

/**
 * @swagger
 * /api/admin/get-by-uid/{uid}:
 *   get:
 *     summary: Obtener un administrador por su UID
 *     description: Requiere rol ADMIN o permiso ADMIN_READ.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID del administrador
 *     responses:
 *       200:
 *         description: Administrador encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 */

/**
 * @swagger
 * /api/admin/get-by-id/{id}:
 *   get:
 *     summary: Obtener un administrador por su ID de MongoDB
 *     description: Requiere rol ADMIN o permiso ADMIN_READ.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del administrador
 *     responses:
 *       200:
 *         description: Administrador encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Admin'
 */
/**
 * @swagger
 * /api/admin/cuentas-contables-tree:
 *   get:
 *     summary: Obtener el árbol de cuentas de todos los contribuyentes (ADMIN)
 *     description: Requiere rol ADMIN. Devuelve una lista de todos los contribuyentes, cada uno con su árbol de cuentas contables.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Árbol de cuentas por contribuyente obtenido exitosamente para todos los contribuyentes.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       contribuyente_nombre:
 *                         type: string
 *                       contribuyente_id:
 *                         type: string
 *                       cuentas:
 *                         type: array
 *                         items:
 *                           $ref: '#/components/schemas/CuentaContableTree'
 */
/**
 * @swagger
 * /api/admin/create:
 *   post:
 *     summary: Crear un nuevo administrador
 *     description: Requiere rol ADMIN o permiso ADMIN_CREATE.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAdminRequest'
 *     responses:
 *       200:
 *         description: Administrador creado exitosamente
 *       409:
 *         description: El correo electrónico ya está registrado
 */

/**
 * @swagger
 * /api/admin/update/{id}:
 *   put:
 *     summary: Actualizar información de un administrador
 *     description: Requiere rol ADMIN o permiso ADMIN_READ.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de MongoDB del administrador a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAdminRequest'
 *     responses:
 *       200:
 *         description: Administrador actualizado exitosamente
 */

/**
 * @swagger
 * /api/admin/delete/{uid}:
 *   delete:
 *     summary: Eliminar un administrador
 *     description: Requiere rol ADMIN o permiso ADMIN_DELETE.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID del administrador a eliminar
 *     responses:
 *       200:
 *         description: Administrador eliminado exitosamente
 */

/**
 * @swagger
 * /api/admin/update-password/{uid}:
 *   put:
 *     summary: Actualizar contraseña de un administrador
 *     description: Requiere rol ADMIN o permiso ADMIN_UPDATE.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID del administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePasswordRequest'
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 */

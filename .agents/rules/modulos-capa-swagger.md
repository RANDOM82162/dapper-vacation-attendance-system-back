# Guía Técnica: Diseño y Configuración de la Capa Swagger (Documentación de API)

La capa de Swagger (`<modulo>.swagger.ts`) es la interfaz de documentación viva del módulo. Utiliza la especificación estándar de **OpenAPI 3** incrustada mediante comentarios especiales de tipo JSDoc (`/** @swagger */`). Su objetivo exclusivo es autogenerar y mantener expuestos de forma gráfica (típicamente mediante Swagger UI) los contratos de API, sus parámetros, cargas útiles (payloads) y requerimientos de seguridad para que los desarrolladores de Front-End, la QA o integradores externos puedan consumirlos eficientemente.

A continuación, se detalla la configuración, funcionalidad y estándar de diseño agnóstico para la construcción y estructuración de los archivos Swagger para cualquier módulo de recursos.

---

## 1. Responsabilidad de la Capa Swagger

El archivo Swagger es declarativo. No bloquea compilaciones y no ejecuta lógicas en tiempo de ejecución de negocio, pero su fidelidad con el código real es crítica. Sus tareas primordiales son:

1. **Definir Schemas (Modelos Descriptivos):** Traducir de manera manual u homologada los contratos desarrollados en los archivos DTO (Interfaces de Base de datos, Requests y Responses) a formatos leíbles por OpenAPI (JSON Schemas).
2. **Definir Rutas (Endpoints):** Describir exhaustivamente cada verbo registrado en la capa de `Routes` (GET, POST, PUT, DELETE, PATCH).
3. **Señalar Autorización:** Advertir obligatoriamente en la cabecera del endpoint los Roles y Middlewares estipulados en las Rutas que pueden consumir el servicio.
4. **Acoplar Variables (Params y Query):** Anotar qué datos deben ir forzosamente en el URI (`path`) o acompañando filtros opcionales (`query`).

### ¿Qué NO hace la Capa Swagger?

- **No valida información real durante las peticiones:** Si Swagger indica que un parámetro es obligatorio, pero el Controller y el DTO no lo exigen en tiempo de ejecución, la petición puede procesarse. Swagger es pasivo.

---

## 2. Estructura Estándar de un Archivo Swagger

Todo archivo `<modulo>.swagger.ts` se organiza semánticamente iniciando por las declaraciones de _Tipos (Schemas)_, seguido de los _Tags de Grupo_ y finalizando con los _Endpoints Individuales_.

### A. Capa de Schemas (Componentes Reutilizables)

Se alojan dentro de un bloque maestro `@swagger components > schemas`. En él se reescriben los moldes de nuestros DTOs.
El objetivo es que los componentes como Enumeradores, Sub-Documentos y Peticiones (ej. `CreateDTO`) existan para ser incrustados mediante `$ref`.

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     EstadoRecurso:
 *       type: string
 *       enum:
 *         - ACTIVO
 *         - INACTIVO
 *     Recurso:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         folio:
 *           type: string
 *         estado:
 *           $ref: '#/components/schemas/EstadoRecurso'
 *     CreateRecursoRequest:
 *       type: object
 *       required:
 *         - folio
 *         - monto_fijo
 *       properties:
 *         folio:
 *           type: string
 *         monto_fijo:
 *           type: number
 */
```

### B. Declaración de Módulo (Tags)

Un pequeño bloque declarativo que le indica al orquestador visual agrupar todos los endpoints subsecuentes bajo un mismo módulo o título.

```typescript
/**
 * @swagger
 * tags:
 *   name: RecursosGenerales
 *   description: Gestión transeccional de recursos y validaciones
 */
```

### C. Bloques de Endpoints (Paths)

Se copia exactamente la URL configurada en Express (omitiendo configuraciones base globales).

```typescript
/**
 * @swagger
 * /api/recurso/get-by-padre/{id_padre}:
 *   get:
 *     summary: Obtener todos los recursos de un dueño
 *     description: Requiere rol ADMIN o permiso RECURSO_READ. # SIEMPRE SEÑALAR AUDITORÍA
 *     tags: [RecursosGenerales]  # Referencia al grupo superior
 *     security:
 *       - bearerAuth: []      # Exigencia técnica de token en UI
 *     parameters:             # Parámetros mixtos (URL y Filtros)
 *       - in: path            # Parámetro dinámico del Router (ej. req.params)
 *         name: id_padre
 *         required: true
 *         schema:
 *           type: string
 *       - in: query           # Parámetros del Filtro GetAll de DTO (ej. req.query)
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:              # Posibles estados de salida del Controller
 *       200:
 *         description: Lista de recursos obtenida
 *       404:
 *         description: Recurso padre no hallado
 */
```

### D. Endpoints de Mutación (Con Body)

Las peticiones que mutan la base de datos (POST, PUT, PATCH) omiten gran parte de los parámetros de tipo Query para alojar `requestBody`.

```typescript
/**
 * @swagger
 * /api/recurso/create:
 *   post:
 *     summary: Crear un nuevo recurso en la bóveda
 *     description: Requiere rol ADMIN o RECURSO_CREATE.
 *     tags: [RecursosGenerales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecursoRequest' # Referencia al componente global
 *     responses:
 *       200:
 *         description: Recurso creado exitosamente
 */
```

---

## 3. Normativas Críticas en Capa Swagger

1. **Uso de Formato YAML:** La indentación (espacios, jamás tabuladores) lo es todo. Un salto de línea extra o un nivel mal jerarquizado destruirá silenciosamente la generación visual o agrupará la información fuera de los rangos debidos.
2. **Sincronía de Seguridad de Middlewares:** Es imperativo que la clave `description:` del bloque de ruta informe textualmente qué restricciones de capa (Roles y Permisos) impusieron las Rutas. Si la ruta dicta `AuthMiddleware.hasPermissionOrRole(PERMISSIONS.VENTAS_DELETE, [ROLES.ADMIN])`, Swagger debe advertirlo.
3. **Inyección Invaluable del RequestBody:** Toda ruta que dependa explícitamente de leer datos en `req.body` dentro de los Controladores (ej: `/update-estado` leyendo un `{ estado: 'CANCELADO' }`), debe estar estrictamente mapeda en un `$ref` de `components` para que el desarrollador front entienda qué "Shape" JSON necesita inyectar.
4. **Default limits (Paginación Transversal):** Todo bloque tipo lista (`get-all` o `get-by-padre`) se adhieren de manera obligatoria al cruce del `req.query`, por ende, si el Controlador asume `$limit 10` como Default, la etiqueta Swagger debe acarrear explícitamente un `default: 10` para indicarlo.

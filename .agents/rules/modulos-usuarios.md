# Documentación Técnica: Ecosistema de Usuarios, Roles y Permisos

## Propósito

Este documento establece la arquitectura única, centralizada y agnóstica para todo manejo de usuarios con acceso al sistema en el Backend del Ecosistema. Aborda el modelo técnico real por el que los roles, la autenticación y la jerarquía de permisos interactúan, y provee una guía inmutable de implementación para cualquier nuevo módulo de usuarios a requerir, garantizando el respeto al estándar MVC-S de 6 archivos.

---

## 1. Arquitectura de Usuarios, Roles y Permisos

La gestión unificada de usuarios depende de tres pilares concurrentes acoplados: el proveedor de identidad (Firebase Auth), la base de datos (MongoDB) y el sistema de evaluación del ciclo de vida de peticiones (`AuthMiddleware`).

### 1.1 Autenticación e Identidad (Firebase)

- Todo usuario que posea credenciales de acceso se registra en **Firebase Auth**.
- El `uid` autogenerado por Firebase es la "Llave Universal" (`Primary Identifier`) y referencia base que interconecta cualquier entidad asociada dentro de MongoDB.
- Las sesiones envían un JWT mediante el header `Authorization: Bearer <token>`, el cual se valida transversalmente vía `AuthMiddleware.verifyToken`.

### 1.2 Autorización: Claims y Roles Macro

- Se utiliza inyección de **Custom Claims** de Firebase. Todo usuario dado de alta o modificado es sincronizado con dos Claims clave:
  1. `role`: Define la jerarquía macro (ej. Administrador, Despacho, Contribuyente, Auxiliar). Los roles disponibles estandarizados residen en `src/middleware/auth.enum.ts` (`ROLES`).
  2. `permissions`: Objeto granular, usualmente evaluado como un array plano luego de transformarse, que delimita operaciones específicas (ej. `[ "factura.create", "cotizacion.read" ]`).

### 1.3 Control de Acceso Jerárquico Vertical (`checkHierarchy`)

La arquitectura de la plataforma está fundamentada en un organigrama de control vertical hacia abajo estructurado en validaciones dentro de `src/middleware/auth.middleware.ts`.
Todo nuevo usuario pertenece a un nivel específico:

- **Nivel Raíz (Nivel 0):** `ADMIN`. Superpone permisos y ve toda la información sin límites en la jerarquía o _ownership_.
- **Nodos Medios (Nivel 1, Nivel 2, etc.):** Poseen registros bajo su _"propiedad"_. A través de la base de datos (MongoDB), el perfil posee llaves foráneas indicando quién es su creador/entidad-jefe.
- **Nodos Hoja (Nivel inferior):** Acceso ultra restringido según Claims. Sin visibilidad por debajo propio.
  _El Middleware evalúa esta tenencia interconectando quién es el solicitante (`req.user.uid`) contra quién es el dueño lógico del recurso abordado._

### 1.4 Permisos Específicos Granulares

Un middleware especializado (`AuthMiddleware.hasPermissionOrRole`) bloquea o transfiere la transacción.
Para cruzar la petición, el usuario debe cumplir una de tres opciones lógicas:

1. Tener Rol nivel Raíz (Administrador).
2. Tener un Rol catalogado en el parámetro `allowedRoles` expuesto del endpoint.
3. Constar con el string del permiso mapeado que coincide con `requiredPermission`.

---

## 2. Guía de Implementación para un Nuevo Tipo de Usuario en el Sistema

Sin excepciones, para agregar un nuevo nivel (ej. "Terceros", "Auditores", "Clientes_Sub"), la arquitectura demanda alterar componentes globales y levantar un módulo MVC-S estructurado exactamente de 6 partes bajo `/src/api/<nuevo_modulo>`.

### Fase Transversal de Infraestructura

Antes del código de negocio, se debe configurar el ecosistema global:

1. **Enumeradores** (`/middleware/auth.enum.ts`):
   - Agregar la llave del rol global dentro del objeto exportado `ROLES` (ej. `NUEVO_ENTIDAD: "NUEVO_ENTIDAD"`).
   - Agregar prefijos de permisos granulares (`PERMISSIONS.NUEVO_ENTIDAD_CREATE: "nuevoentidad.create"`, `_READ`, `_UPDATE`, `_DELETE`).
2. **Adhesión a Jerarquía** (`/middleware/auth.middleware.ts`):
   - Integrar la validación propia de las reglas de negocio de pertenencia dentro de la función `checkHierarchy`. Responder asíncronamente `true` cuando se detecte que las consultas de Base de Datos afirman que el solicitante es "dueño" (por llaves foráneas) del nuevo usuario.

### Fase de Arquitectura de Módulo (MVC-S Base)

La integración demanda crear los siguientes 6 archivos base de manera estandarizada y obligatoria.

#### 1. `<modulo>.routes.ts`

Aloja las declaraciones de Express. Cada ruta inyectable debe estar forzada por los middlewares de verificación secuencial antes de acceder al controlador.

```typescript
router.post(
  "/create",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.NUEVO_ENTIDAD_CREATE, [
    ROLES.ADMIN,
    ROLES.OTRO_ROL,
  ]),
  moduloController.createController,
);
```

#### 2. `<modulo>Controller.ts`

Manejador plano de ciclo HTTP y errores.

- Valida superficialmente los datos vitales entrantes de `req.body.data`.
- Delega la lógica de negocio llamando inmediatamente al Service para asincronía asilada.
- Retorna exclusivamente `Respuesta JSON (200 OK)` con `status`, `message`, y `data`. Un error interno se desploma en su único bloque `catch(error) { next(error) }` para que lo intercepte el error general del ecosistema.

#### 3. `<modulo>Service.ts`

El orquestador total. Aquí se fusiona Firebase Auth (Identidad) con base de datos (MongoDB).

- **Proceso de Creación (`create`):**
  1. Instanciar en `firebase.auth().createUser({...})`.
  2. Otorgarle nivel jerárquico inyectando los _cliams_: `setCustomUserClaims(uid, { role: ROLES.NUEVO, permissions: {} })`.
  3. Transformar los parámetros en el DTO oficial, insertando el `uid` (respuesta de Auth) obligatoriamente junto a los datos en `model.createEnMongoDB(...)`.
  4. Levantar Side Effects (sin interrumpir la función, asíncronos concurrentes):
     - `registrarLog(...)`: Auditoría estricta obligatoria (quien ejecutó la acción en `req.user.uid`).
     - `registrarMetrica(...)`.
     - Alertar notificaciones si corresponde vía correo: `sendNewUserCredentials(...)`.
- **Proceso de Modificación (`update`):**
  Obliga a mantener sincronizado Firebase y Mongo en caso de cambiar información base (ej: cambio de email o nombre principal).

#### 4. `<modulo>Model.ts`

Archivan queries puros encapsulados frente a MongoDB y utilizan las librerías transversales de la plataforma sin tocar reglas de negocio.

- Funciones CRUD obligatorias: `get`, `create`, `update`, `delete`.
- Las listados de datos deben exportar un objeto `PaginacionRespuesta<T>`, haciendo uso del paginado local calculado tras el resultado de un `db.collection().aggregate(pipeline)` con uso de `$lookup` si fuera necesario un árbol relacional y `$count` para el recuento del número absoluto de ítems.

#### 5. `<modulo>Dto.ts`

Define las interfaces Type-safe (ej. `CreateDTO`, `UpdateDTO`, `GetAllFilters`) y las entidades primordiales del modelo de persistencia que se adhieren lógicamente al tipado.

#### 6. `<modulo>.swagger.ts`

El documento técnico auto-anclable para la visualización por herramientas como Swagger UI, cubriendo interfaces, códigos y ejemplos por endpoints.

---

### Prevenciones Críticas

1. **Fallo de Transaccionalidad:** Los sistemas Firebase y Mongo no garantizan rollback nativo bidireccional, ergo, si la inserción de Mongo cae o produce un throw (ej. llaves duplicadas, error sintáctico), las interceptaciones del Controller/Middleware derivaran en el `BaseError` debiendo gestionar advertencia explícita. Controlar de ser necesario eliminando el `auth` residual.
2. **Duplicidad Email:** Las interacciones del Service deben encapsular el fallo nativo de Firebase con códigos limpios: `if(errorInfo.code == 'auth/email-already-exists') throw BaseError(...)` con código `HttpStatusCode.CONFLICT`.
3. **Pertenencia Huerfana:** Ningún modelo de usuario medio/hoja debe darse de alta si el cuerpo de creación carece del enlace (ej: `id_padre`) que garantice su mapeo horizontal/vertical. Esto debe validarse en el servicio.

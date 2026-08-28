# Guía Técnica: Diseño y Configuración de la Capa de Rutas (Router)

La capa de Rutas (`routes`) es la frontera pública del módulo. En la arquitectura MVC-S, es el archivo de declaración de puertos, por lo que actúa como un vigilante aduanero. Su principal propósito es registrar los endpoints de Express y orquestar una estricta cadena de seguridad (Middlewares) antes de permitir que la petición pase al Controlador.

A continuación, se detalla la configuración, funcionalidad y estándar de diseño agnóstico para la construcción y estructuración de los enrutadores (`<modulo>.routes.ts`) para cualquier módulo de recursos.

---

## 1. Responsabilidad de la Capa de Rutas

El archivo de rutas jamás manipula datos, no abre promesas y no responde a la petición. Sus tareas exclusivas son:

1. **Definir la URL Relativa:** Empalmar los verbos HTTP (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) con su URI semántico (ej. `/get-all`, `/create`, `/delete/:uid`).
2. **Validar Autenticación:** Cortar de raíz cualquier petición no autenticada antes que gaste ciclos de servidor (Verificación simple de Token JWT).
3. **Validar Autorización Macro (Rol y Permisos):** Verificar que el usuario tenga el gafete correcto o el nivel gerencial necesario para acceder a la ruta.
4. **Validar Autoridad de Propiedad (Ownership):** Activar los interceptores de validación horizontal/vertical asíncronos que preguntarán a Base de Datos si el usuario tiene autoridad lógica sobre el `id` o `uid` al que intenta modificar o leer.
5. **Delegar:** Inyectar la petición limpia en el método final del Controlador.

---

## 2. Estructura Estándar de la Cadena de Middlewares

Todo archivo de enrutamiento utiliza el router propio de Express `express.Router()` e inyecta hasta tres (3) niveles de barreras de seguridad pre-configuradas provenientes de `src/middleware/auth.middleware.ts`.

### A. Dependencias Invariables

El router importa Express, el controlador asignado, el middleware oficial de la plataforma y el diccionario de roles `auth.enum.ts`.

```typescript
import express from "express";
import * as controller from "./recursoController";
import { AuthMiddleware } from "../../middleware/auth.middleware";
import { PERMISSIONS, ROLES } from "../../middleware/auth.enum";

// Importación opcional de métodos del modelo para el validador de Resource
import { getRecursoById } from "./recursoModel";

const router = express.Router();
```

### B. Nivel 1: Autenticación (`verifyToken`)

El eslabón base de la cadena. **Nunca** una ruta debe ir sin este nivel (salvo un webhook o login). Extrae el `Bearer Token` y adjunta la firma validada al `req.user`.

```typescript
router.get("/mi-ruta", AuthMiddleware.verifyToken, ... );
```

### C. Nivel 2: Autorización por Roles o Permisos (`hasPermissionOrRole`)

Segunda barrera. Limita si, estadísticamente, el tipo de usuario podría hacer esto. Exige dos parámetros:

1. Un permiso duro extraído del `auth.enum.ts` (ej: `PERMISSIONS.RECURSO_CREATE`).
2. Un arreglo de Roles excepcionales que siempre superarán este chequeo y pueden pasar (usualmente `[ROLES.ADMIN]`, u otros si amerita).

```typescript
router.post(
  "/create",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.RECURSO_CREATE, [
    ROLES.ADMIN,
    ROLES.DESPACHO,
  ]),
  controller.createRecursoController,
);
```

### D. Nivel 3: Validación Estricta de Propiedad Jerárquica (`canManage...`)

Un middleware asíncrono potente. Sirve para no permitir que un `CONTRIBUYENTE A` borre una factura del `CONTRIBUYENTE B`. Evita que estas verificaciones ensucien la capa de Service o Controller. Se utiliza en ramas con `/:uid` explícito o `/:id`.

Existen dos variables comunes:

**1. `canManageByUid` (Cuando la tabla objetivo es un usuario / entidad dueña)**
Evalúa directamente si el `currentUser` tiene autoridad sobre la variable extraída de `req.params.uid`. Ideal para listar, ejemplo: _Listar todos los recursos de un Contribuyente específico_.

```typescript
router.get(
  "/get-by-padre/:uid",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.RECURSO_READ, [
    ROLES.ADMIN,
    ROLES.PADRE,
    ROLES.SUB_PADRE,
  ]),
  AuthMiddleware.canManageByUid, // Revisa si quien dispara es dueño del :uid del URI
  controller.getRecursosByPadreController,
);
```

**2. `canManageResource` (Cuando la tabla objetivo es de recursos, facturas, documentos)**
Cuando el parámetro en URL es el ID de MongoDB (ej. `.../delete/65b3x...`), el framework necesita ir a la BD y descubrir la llave foránea dueña de ese documento para validar si tenemos permiso sobre ella.

```typescript
router.put(
  "/update/:id",
  AuthMiddleware.verifyToken,
  AuthMiddleware.hasPermissionOrRole(PERMISSIONS.RECURSO_UPDATE, [
    ROLES.ADMIN,
    ROLES.PADRE,
  ]),
  // Parámetros: (FuncionGetById, CampoDondeEstaLaForanea)
  AuthMiddleware.canManageResource(getRecursoById, "id_padre"),
  controller.updateRecursoController,
);
```

---

## 3. Patrones de Rutas Clásicos en Módulos

Al igual que las capas consecuentes, un archivo de Router expone verbos con convención estandarizada:

```typescript
// 1. GET ALL PLANO (Restringido comúnmente al máximo nivel de acceso)
router.get("/get-all", ...);

// 2. GET LISTADOS DE DUEÑO (Listado masivo bajo una foránea de entidad dueña: :uid)
router.get("/get-by-padre/:uid", ...);

// 3. GET ELEMENTO UNITARIO (Lectura a detalle con :id de BD)
router.get("/get-by-id/:id", ...);

// 4. CREACIÓN (Mutación sin ID, POST puro)
router.post("/create", ...);

// 5. ACTUALIZACIÓN GENERAL (Mutaciones en bloque con PUT)
router.put("/update/:id", ...);

// 6. ELIMINACIÓN GENERAL (Método nativo DELETE)
router.delete("/delete/:id", ...);

// 7. ACTUALIZACIONES DE DATO ESPECÍFICO (Mutaciones atómicas con PATCH)
// Ejemplo: Solo cambiar un switch o estatus muy específico
router.patch("/update-estado/:id", ...);
```

---

## 4. Normativas Críticas del Enrutador

1. **El orden es vital:** Node.js procesa Middlewares estrictamente de izquierda a derecha. Poner a validación de roles de negocio ANTES de validar el token arrojará error de objeto nulo en el sistema.
2. **Sin bloqueos sincrónicos:** Nunca inyectar promesas quemadas dentro de la declaración de la ruta (Ej: `(req, res, next) => { ... }`). Siempre delegar a punteros de funciones puras (`controller.metodo`).
3. **Uso Restringido de Verbos:** Usar verbos para semántica lógica (No usar un `POST` para traer datos de reportes que sean cacheables a menos que traigan un body extremo, y no usar `GET` para eliminar).
4. **Acoplamiento Central:** El archivo `router` siempre termina exportándose entero (`export default router;`) para ser capturado posteriormente en las raíces orquestadoras de Express (`app.routes.ts` o integrador superior).

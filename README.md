# Guía de Configuración y Despliegue (Backend Base)

Este documento sirve como guía oficial para inicializar y desplegar este "Backend Base" fundado en la arquitectura MVC-S. Dado que el proyecto depende de tres tecnologías externas o de nube (Firebase, MongoDB y un servidor SMTP), es obligatorio configurarlas correctamente antes de probar o ejecutar la aplicación.

## Índice

- [Guía de Configuración y Despliegue (Backend Base)](#guía-de-configuración-y-despliegue-backend-base)
  - [1. Requisitos Previos (Prerrequisitos)](#1-requisitos-previos-prerrequisitos)
  - [2. Configuración de Variables de Entorno (`.env`)](#2-configuración-de-variables-de-entorno-env)
  - [3. Configuración de Proveedor de Identidad: Firebase](#3-configuración-de-proveedor-de-identidad-firebase)
  - [4. Configuración del SMTP (Módulo de Correos)](#4-configuración-del-smtp-módulo-de-correos)
  - [5. Instrucciones de Ejecución](#5-instrucciones-de-ejecución)
  - [6. Sincronización Inicial (Primer Administrador)](#6-sincronización-inicial-primer-administrador)
- [Contexto de Sistema](#contexto-de-sistema)
  - [1. Resumen del Proyecto](#1-resumen-del-proyecto)
  - [2. Stack Tecnológico](#2-stack-tecnológico)
  - [3. Arquitectura del Sistema (MVC-S)](#3-arquitectura-del-sistema-mvc-s)
  - [4. Sistema de Rutas](#4-sistema-de-rutas)
  - [5. Convenciones de Código y Estilo](#5-convenciones-de-código-y-estilo)
  - [6. Manejo de Errores](#6-manejo-de-errores)
  - [7. Módulos Core Transversales](#7-módulos-core-transversales)
- [Guía Técnica: Diseño y Configuración de la Capa DTO (Data Transfer Object)](#guía-técnica-diseño-y-configuración-de-la-capa-dto-data-transfer-object)
  - [1. Responsabilidad de la Capa DTO](#1-responsabilidad-de-la-capa-dto)
  - [2. Estructura Estándar de un Archivo DTO](#2-estructura-estándar-de-un-archivo-dto)
  - [3. Guía Funcional: Implementación en Flujo de Trabajo](#3-guía-funcional-implementación-en-flujo-de-trabajo)
- [Guía Técnica: Diseño y Configuración de la Capa Model (Modelos de Recursos)](#guía-técnica-diseño-y-configuración-de-la-capa-model-modelos-de-recursos)
  - [1. Responsabilidad de la Capa Model](#1-responsabilidad-de-la-capa-model)
  - [2. Estructura Estándar de un Archivo Model](#2-estructura-estándar-de-un-archivo-model)
  - [3. Normativa Crítica en el Catch Integrado](#3-normativa-crítica-en-el-catch-integrado)
- [Guía Técnica: Diseño y Configuración de la Capa de Servicios](#guía-técnica-diseño-y-configuración-de-la-capa-de-servicios)
  - [1. Responsabilidad de la Capa de Servicio](#1-responsabilidad-de-la-capa-de-servicio)
  - [2. Estructura Estándar de un Archivo Service](#2-estructura-estándar-de-un-archivo-service)
  - [3. Normativas Críticas en Capa de Servicio](#3-normativas-críticas-en-capa-de-servicio)
- [Guía Técnica: Diseño y Configuración de la Capa de Controladores](#guía-técnica-diseño-y-configuración-de-la-capa-de-controladores)
  - [1. Responsabilidad de la Capa de Controlador](#1-responsabilidad-de-la-capa-de-controlador)
  - [2. Estructura Estándar de un Archivo Controller](#2-estructura-estándar-de-un-archivo-controller)
  - [3. Normativas Críticas en Capa de Controlador](#3-normativas-críticas-en-capa-de-controlador)
- [Guía Técnica: Diseño y Configuración de la Capa de Rutas (Router)](#guía-técnica-diseño-y-configuración-de-la-capa-de-rutas-router)
  - [1. Responsabilidad de la Capa de Rutas](#1-responsabilidad-de-la-capa-de-rutas)
  - [2. Estructura Estándar de la Cadena de Middlewares](#2-estructura-estándar-de-la-cadena-de-middlewares)
  - [3. Patrones de Rutas Clásicos en Módulos](#3-patrones-de-rutas-clásicos-en-módulos)
  - [4. Normativas Críticas del Enrutador](#4-normativas-críticas-del-enrutador)
- [Guía Técnica: Diseño y Configuración de la Capa Swagger (Documentación de API)](#guía-técnica-diseño-y-configuración-de-la-capa-swagger-documentación-de-api)
  - [1. Responsabilidad de la Capa Swagger](#1-responsabilidad-de-la-capa-swagger)
  - [2. Estructura Estándar de un Archivo Swagger](#2-estructura-estándar-de-un-archivo-swagger)
  - [3. Normativas Críticas en Capa Swagger](#3-normativas-críticas-en-capa-swagger)
- [Guía Técnica: Módulo Transversal de Logs (Auditoría e Historial)](#guía-técnica-módulo-transversal-de-logs-auditoría-e-historial)
  - [1. Responsabilidad y Naturaleza del Módulo Logs](#1-responsabilidad-y-naturaleza-del-módulo-logs)
  - [2. El Modelo DTO de Registro (`CreateLogDto`)](#2-el-modelo-dto-de-registro-createlogdto)
  - [3. Implementación: Patrón Fire and Forget](#3-implementación-patrón-fire-and-forget)
  - [4. ¿Cómo utilizar el Módulo Logs desde otros Servicios?](#4-cómo-utilizar-el-módulo-logs-desde-otros-servicios)
  - [5. El Sistema de Lectura (El Controlador y Ruta de Lectura)](#5-el-sistema-de-lectura-el-controlador-y-ruta-de-lectura)
- [Guía Técnica: Módulo Transversal de Métricas y Analíticas (`Metrics`)](#guía-técnica-módulo-transversal-de-métricas-y-analíticas-metrics)
  - [1. Responsabilidad y Filosofía del Módulo Metrics](#1-responsabilidad-y-filosofía-del-módulo-metrics)
  - [2. El Modelo de Almacenamiento Cúbico (`Analytics`)](#2-el-modelo-de-almacenamiento-cúbico-analytics)
  - [3. Implementación: Motor de Grabado Atómico (`$inc`)](#3-implementación-motor-de-grabado-atómico-inc)
  - [4. ¿Cómo utilizar y registrar métricas desde otros módulos?](#4-cómo-utilizar-y-registrar-métricas-desde-otros-módulos)
  - [5. Extracción y Agrupación Selectiva (`MainDashboardStats`)](#5-extracción-y-agrupación-selectiva-maindashboardstats)
- [Guía Técnica: Módulo Transversal de Notificaciones (`Notificaciones`)](#guía-técnica-módulo-transversal-de-notificaciones-notificaciones)
  - [1. Responsabilidad y Filosofía del Módulo](#1-responsabilidad-y-filosofía-del-módulo-1)
  - [2. El Modelo de Contrato y Categorización (`notificacionesDto`)](#2-el-modelo-de-contrato-y-categorización-notificacionesdto)
  - [3. Implementación Subyacente (El Orquestador Double-Duty)](#3-implementación-subyacente-el-orquestador-double-duty)
  - [4. ¿Cómo utilizar y disparar notificaciones desde otros módulos?](#4-cómo-utilizar-y-disparar-notificaciones-desde-otros-módulos)
  - [5. El Buzón Front-End (Puntos Críticos de Lectura)](#5-el-buzón-front-end-puntos-críticos-de-lectura)
- [Documentación Técnica: Ecosistema de Usuarios, Roles y Permisos](#documentación-técnica-ecosistema-de-usuarios-roles-y-permisos)
- [Guía Técnica: Módulo Transversal de Correos Electrónicos (`Mail`)](#guía-técnica-módulo-transversal-de-correos-electrónicos-mail)
  - [1. Responsabilidad y Filosofía del Módulo](#1-responsabilidad-y-filosofía-del-módulo-2)
  - [2. El Ecosistema de Plantillas (Renderizado HTML)](#2-el-ecosistema-de-plantillas-renderizado-html)
  - [3. Implementación Subyacente (El Orquestador de Nodemailer)](#3-implementación-subyacente-el-orquestador-de-nodemailer)
  - [4. ¿Cómo utilizar e invocar correos desde otros módulos?](#4-cómo-utilizar-e-invocar-correos-desde-otros-módulos)
  - [5. El Rol del Controlador Propio (`access.controller`)](#5-el-rol-del-controlador-propio-accesscontroller)
- [Arquitectura de Usuarios, Roles y Permisos](#arquitectura-de-usuarios-roles-y-permisos)
  - [2. Guía de Implementación para un Nuevo Tipo de Usuario en el Sistema](#2-guía-de-implementación-para-un-nuevo-tipo-de-usuario-en-el-sistema)

---

## 1. Requisitos Previos (Prerrequisitos)

Antes de clonar el repositorio y correr el proyecto, asegúrate de tener instalado en tu entorno de desarrollo local:

- **Node.js**: (Recomendado v18.x a v20.x).
- **TypeScript & ts-node**: Si compilarás globalmente o ejecutarás en en entorno dev.
- **Docker & Docker Compose**: Opcional, pero altamente recomendado si prefieres correr tu MongoDB de manera local dentro de un contenedor en vez de usar MongoDB Atlas.
- **Gestor de paquetes**: npm o yarn.

---

## 2. Configuración de Variables de Entorno (`.env`)

En la raíz del proyecto encontrarás el archivo `.env` o `.env.example`. Copia ese archivo y renómbralo a `.env` si es necesario. Ajusta las variables de entorno de la siguiente forma:

```properties
# ===============================
# 1. Configuración de Base de Datos
# ===============================
# A. Opción Local (Docker):
CONNECTION_STRING=mongodb://localhost:27017/tu_bd_local
# B. Opción Nube (Atlas):
# CONNECTION_STRING=mongodb+srv://<usuario>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority

DB_NAME=proyecto_db

# ===============================
# 2. Configuración del Servidor
# ===============================
PORT=8080
NODE_ENV=development

# ===============================
# 3. Seguridad y Criptografía
# ===============================
JWT_KEY=tu_clave_secreta_para_jsonwebtoken
ENCRYPTION_SECRET=una_clave_larga_y_segura_para_cifrados_del_sistema

# ===============================
# 4. Configuración de Firebase (GCP)
# ===============================
PROJECT_ID=tu-proyecto-firebase
GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json
STORAGE_BUCKET=tu-proyecto-firebase.firebasestorage.app
DB_URL=https://tu-proyecto-firebase.firebaseio.com
```

---

## 3. Configuración de Proveedor de Identidad: Firebase

El backend asume validación asimétrica mediante Firebase Admin SDK (Tokens JWT delegados), también usa Cloud Messaging (Notificaciones Push) y Cloud Storage (Archivos PDF, imágenes).

### ¿Cómo obtener tus credenciales de Firebase?

1. Ve a la **Consola de Firebase (Firebase Console)**.
2. Ingresa a **Configuración del proyecto (⚙️) > Cuentas de servicio**.
3. Selecciona **Generar nueva clave privada**.
4. Descarga el archivo JSON resultante.
5. Coloca el archivo JSON en la **raíz de tu proyecto** backend y renómbralo a **`firebase-service-account.json`**.
6. Asegúrate de que el archivo estipulado en el `.env` (`GOOGLE_APPLICATION_CREDENTIALS=./firebase-service-account.json`) empate correctamente con el nombre del JSON recién descargado.

> **Importante:** Nunca hagas commit (git add) del archivo `firebase-service-account.json`. Debe estar ignorado en tu archivo `.gitignore`.

---

## 4. Configuración del SMTP (Módulo de Correos)

Si deseas utilizar las utilidades expuestas en el módulo `mailService` (Ej. Enviar "Correos de Nueva Cotización", "Alertas de Restablecimiento de contraseña", etc.), debes aprovisionar tus claves de relé SMTP:

1. Ingresa a tu archivo `src/api/mail/mailService.ts`.
2. Busca la función generadora `nodemailer.createTransport()`.
3. Sustituye la configuración `host`, `user` y `pass` predeterminadas por tu proveedor preferido (Brevo, SendGrid, Amazon SES, Outlook).

```typescript
const createTransporter = () => {
  return nodemailer.createTransport({
    host: "smtp-relay.midominio.com",
    port: 587,
    secure: false, // True for port 465, False for other ports
    auth: {
      user: "no-reply@mi-plataforma.com",
      pass: process.env.SMTP_PASSWORD, // Preferible usar .env
    },
  });
};
```

---

## 5. Instrucciones de Ejecución

Una vez que tienes el `.env` preparado, las credenciales de Firebase colocadas y MongoDB a la mano, puedes levantar el proyecto.

### A. Opción 1: Desarrollo Nativo usando entorno "Nodemon"

En caso de tener MongoDB corriendo externamente (MongoDB Atlas cloud) o en un servicio background distinto:

1. Ejecuta `npm install` para empaquetar librerías de `package.json`.
2. Corre el script de desarrollo:
   ```bash
   npm run dev
   ```
3. Nodemon y ts-node comenzarán a transpirar typescript al vuelo y expondrán la API en `http://localhost:8080/api/ping`. (Te informará visualmente "Rutas Registradas..." "Iniciando servidor...").

### B. Opción 2: Desarrollo o Producción Rápida con Docker Compose

Si deseas que la base de datos se levante automáticamente y tu nodo de Node.js coexista localmente, utiliza Docker.
El repositorio cuenta con un archivo `docker-compose.yml`.

1. Asegúrate de tener Docker Desktop o Docker Daemon activo.
2. Ejecuta el archivo compose:
   ```bash
   npm run docker:up
   # o alternativamente:
   docker-compose up --build -d
   ```
3. Docker orquestará dos contenedores:
   - `mongo_db`: Tu base de datos local (Expuesta en puerto 27018 localmente hacia MongoDB Compass). Se inyectarán usuarios de prueba si dejas que lea la carpeta `./mongo-init`.
   - `app`: El servidor Backend de Express escuchando en su puerto `8080`.

Para derribar el entorno virtual simplemente ejecuta `npm run docker:down`.

---

## 6. Sincronización Inicial (Primer Administrador)

Debido a que tu plataforma está sellada por jerarquías y Custom Claims, cualquier cuenta que crees desde tu panel Frontend nacerá sin permisos.

Para "dar a luz" a tu primer Super-Administrador:

1. Regístralo típicamente en Firebase Authentication (Ej: Creándolo directo desde la consola de Firebase Web manualment).
2. Copia su UID.
3. Ingresa al archivo `admin.js` en la raíz de tu proyecto e inyecta el UID a la variable `const uid = "TU_USER_ID"`.
4. Ejecuta un script singular en Node para forzarle los permisos por detrás.

```bash
node admin.js
```

El archivo de consola imprimirá `¡Claims configurados con éxito!`. A partir de este momento, dicho usuario ya es "Root" y puede iniciar sesión e invocar endpoints en la base de datos para crear, invitar o migrar a los demás miembros.

# Contexto de Sistema

## 1. Resumen del Proyecto

**`[Nombre_del_Repositorio_Backend]`** es el API REST del backend de una plataforma `[Tipo_de_Plataforma_ej_SaaS_B2B]`. El sistema gestiona el ciclo de vida de operaciones para distintos niveles de usuarios:

- **`[Rol_Raíz_ej_Administrador_Plataforma]`**: Control global y gestión del sistema. Nivel jerárquico raíz.
- **`[Rol_Medio_ej_Organización/Inquilino]`**: Entidad principal que utiliza el servicio. Nivel medio.
- **`[Rol_Hoja_ej_Usuario/Empleado]`**: Miembro de la organización con permisos limitados. Nivel hoja.

Funcionalidades principales:

- `[Funcionalidad_Core_1_ej_Gestión_de_Inventarios_y_Trazabilidad]`.
- `[Funcionalidad_Core_2_ej_Sistema_de_Pagos_y_Suscripciones]`.
- **Notificaciones** `[ej_push/emails]`, **Métricas** y **Logs** de auditoría.
- Generación de reportes `[ej_PDFs/Excel]`.
- Integraciones con terceros `[ej_Pasarelas_de_pago,_APIs_externas]`.

## 2. Stack Tecnológico

- **Runtime & Lenguaje:** `[ej_Node.js_20.x, TypeScript 5.x, Express 4]`.
- **Base de datos:** `[ej_MongoDB, PostgreSQL]`. _Nota: `[Especificar_ORM/Driver_ej_Mongoose,_Prisma,_TypeORM]_`.
- **Autenticación:** `[ej_Firebase_Auth,_Auth0,_JWT_Nativo]`.
- **Autorización:** `[Mecanismo_de_Permisos_ej_RBAC_basado_en_JWT]`.
- **Infraestructura:** `[ej_AWS, Google Cloud, Docker]`.
- **Utilidades Core:** `[Listado_de_librerías_clave_ej_date-fns, winston, joi, etc.]`.

## 3. Arquitectura del Sistema (MVC-S)

El código reside en `src/`. Cada módulo de la API (`src/api/<modulo>/`) sigue una estructura estricta de 6 archivos:

1. `<modulo>.routes.ts`: Rutas del framework + cadena de middlewares de autenticación/autorización.
2. `<modulo>Controller.ts`: Extrae parámetros de la petición (req), valida su presencia estructural básica y llama al Service. **No tiene lógica de negocio.**
3. `<modulo>Service.ts`: Contiene toda la lógica de negocio. Orquesta llamadas al Model. Dispara _side-effects_ (logs, métricas, notificaciones).
4. `<modulo>Model.ts`: Acceso puro a la Base de Datos (queries, transacciones).
5. `<modulo>Dto.ts`: Interfaces tipadas, Tipos genéricos y Enums del dominio.
6. `<modulo>.swagger.ts`: Documentacion tecnica de la api.

**Flujo de petición:**
Request -> Router -> Middleware (Auth) -> Controller -> Service -> Model -> Base de Datos.
_Retorno:_ Base de Datos -> Model -> Service (lanza side-effects) -> Controller -> Response (HTTP Status estándar con payload).

## 4. Sistema de Rutas

Prefijo global: `[ej_/api/v1]` (ej. `/api/v1/<entidad>/get-all`). Convención de rutas principales:

- `GET /get-all` (Paginado, habitualmente restringido por rol)
- `GET /get-by-[entidad_padre]/:parentId`
- `GET /get-by-id/:id`
- `POST /create`
- `PUT /update/:id`
- `DELETE /delete/:id`

## 5. Convenciones de Código y Estilo

- **Asincronía:** Todo el código asíncrono utiliza `async/await`.
- **Bloques Try/Catch:** Único `try/catch` por función de entrada (ej. en el Controller o Service raíz). Los errores capturados se envuelven en una clase de error base personalizada (ej. `[BaseError]`).
- **Controladores:** Siempre delegan la lógica. Envían respuestas con una estructura JSON estandarizada: `[ej_res.status(200).send({ status: 200, message: "...", data: result });]`.
- **Imports:** `[Reglas_de_importación_ej_Namespacing_preferido:_import_*_as_service_from_"./moduloService"]`.

### Ejemplo de Patrón de Controlador

```typescript
export async function createEntityController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = req.body.data;
    if (!data)
      throw new ParametersError(
        "Missing body params",
        "createEntity",
        HttpStatusCode.BAD_REQUEST,
      );
    const result = await service.createEntity(data, req.user);
    res
      .status(HttpStatusCode.OK)
      .send({ status: HttpStatusCode.OK, message: "Creado", data: result });
  } catch (error) {
    next(error);
  }
}
```

## 6. Manejo de Errores

- Existe un middleware global interceptor de errores.
- Se utilizan clases derivadas de `[BaseError]` (ej. `ParametersError`, `NotFoundError`, `UnauthorizedError`, `ExternalApiError`).
- `[Regla_de_Status_HTTP_ej_Todas_las_repuestas_exitosas_son_200,_el_detalle_va_en_el_payload]`.

## 7. Módulos Core Transversales

- **Base de Datos:** Funciones de conexión, utilidades de IDs y manejo de sesiones/transacciones.
- **Autenticación y Autorización (`auth.middleware.ts`):** Verificación de token, permisos de acceso y control de jerarquía de roles (`[Nivel_1] > [Nivel_2] > [Nivel_3]`).
- **Side Effects:** Ejecutados en los Services bajo patrón _fire-and-forget_ (sin bloquear el hilo principal):
- `[Funcion_Log_ej_registrarLog(data)]`
- `[Funcion_Metrica_ej_registrarMetrica(entidad, evento)]`
- `[Funcion_Notificacion_ej_createNotificacion(data)]`

- **Paginación:** Uso estandarizado de un DTO/Interfaz `[PaginacionRespuesta<T>]` (data, totalItems, totalPages, currentPage), alimentado por métodos estandarizados de la Base de Datos.

# Guía Técnica: Diseño y Configuración de la Capa DTO (Data Transfer Object)

La capa DTO (Data Transfer Object) en la arquitectura MVC-S sirve como el contrato estricto de tipado y estructura para las entidades de dominio y el transporte de datos entre las capas de la aplicación (Controller, Service, Model) y el cliente Front-End.

A continuación, se detalla la configuración, funcionalidad y el estándar de diseño agnóstico para la construcción de DTOs en módulos de recursos (entidades no correspondientes a usuarios, como documentos, inventario, catálogos, u operaciones transaccionales).

---

## 1. Responsabilidad de la Capa DTO

El archivo `<modulo>Dto.ts` es la única fuente de la verdad para el tipo de dato en el módulo. Su principal propósito es:

1. **Definir el Modelo de Base de Datos:** Establece la interfaz primaria que mapea exactamente cómo se aloja un documento dentro de la colección/tabla de base de datos.
2. **Definir Contratos de Entrada (Mutaciones):** Estipula qué campos son requeridos, opcionales o prohibidos al crear o actualizar una entidad.
3. **Definir Contratos de Búsqueda:** Estandariza los filtros permitidos en consultas paginadas o búsquedas complejas.
4. **Estandarizar Salidas:** Define tipados transversales, como los formatos de paginación o versiones compactas (ligeras) de las entidades.

A diferencia del Controlador, la capa DTO no contiene lógica de ejecución ni verificaciones abstractas en tiempo de ejecución (como validaciones Zod/Joi, a menos que se estipule una convención mixta); es puramente **Type-Safety** estático (TypeScript).

---

## 2. Estructura Estándar de un Archivo DTO

Todo archivo DTO de un módulo de recurso debe dividirse lógicamente en las siguientes secciones secuenciales:

### A. Enumeradores y Sub-entidades (Opcional pero Recomendable)

Antes de declarar la entidad principal, se deben definir tipos estrictos como `Enums` o tipos anidados complejos. Esto promueve el rehúso granular.

```typescript
export enum EstadoRecurso {
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO",
  PROCESANDO = "PROCESANDO",
}

export interface SubDocumento {
  campo_interno: string;
  valor: number;
}
```

### B. Entidad Base (Model Interface)

La representación purista de cómo luce el objeto al ser consultado de la base de datos. Incluye los identificadores (ej. `_id` de MongoDB), llaves foráneas y _timestamps_ autogenerados.

```typescript
import { ObjectId } from "mongodb";

export interface RecursoBase {
  _id: ObjectId;
  id_padre: string; // Llave foránea de pertenencia
  folio: string; // Identificador humano o lógico
  estado: EstadoRecurso;
  detalles: SubDocumento[]; // Uso de sub-entidades
  monto_total: number;
  es_restringido: boolean;
  creationDateTS: number; // Timestamp interno de la arquitectura
}
```

### C. DTOs de Inserción (Create y Update)

Estos tipos derivan de la Entidad Base y se utilizan estrictamente para tipar el `req.body.data` que fluye del Controller al Service.

**Create DTO:** Omite identificadores inmutables autogenerados (`_id`, `creationDateTS`) y permite tipar como opcionales campos que el backend calcula automáticamente. Ocasionalmente, el DTO de creación de Front-End puede recibir Strings (`"2023-11-01"`) para fechas que el Service parsea a instantes `Date`.

```typescript
export interface CreateRecursoDto {
  id_padre: string;
  folio?: string; // Opcional, podría autogenerarse en el backend
  estado: EstadoRecurso;
  detalles: SubDocumento[];
  monto_total: number;
  es_restringido: boolean;
  parametro_temporal_frontend?: string; // Dato auxiliar que no va a BD
}
```

**Update DTO:** Por lo general utiliza tipado derivado como `Partial` y `Omit`. Garantiza que campos vitales de auditoría jamás puedan ser mutados a través de un endpoint público.

```typescript
// Todo es opcional (Partial), PERO excluyendo los inmutables de la base
export interface UpdateRecursoDto extends Partial<
  Omit<RecursoBase, "_id" | "creationDateTS" | "id_padre">
> {}
```

### D. Filtros de Búsqueda Multipropósito

Provee el "molde" estricto de las querys (`req.query` tipado) enviadas a los endpoints de tipo `get-all`. Configura capacidades para búsqueda de texto, por fechas y límites de paginación.

```typescript
export interface GetAllRecursosFilters {
  search?: string; // Para regex o full-text search
  idPadre?: string; // Filtro relacional
  estado?: EstadoRecurso; // Filtro estricto por enum
  fechaInicio?: string; // Range filters
  fechaFin?: string;
  page?: number; // Paginación
  limit?: number;
}
```

### E. Respuesta Transversal Paginada

Para no romper contratos con las tablas / data-grids del Front-End, las respuestas a plurales implementan una interfaz genérica que obliga la inyección de metadata de paginación nativa de las consultas particionadas de la Base de Datos.

```typescript
export interface PaginacionRespuesta<T> {
  data: T[]; // Arreglo del DTO Principal o DTO Ligero
  meta: {
    totalItems: number | void;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}
```

### F. DTOs de Proyección (Versiones Ligeras)

Para módulos de transacciones masivas (ej. catálogos largos, miles de items), definir un tipo restringido mejora la semántica cuando el backend solo recupera ($project) ciertas columnas críticas.

```typescript
export interface RecursoSimpleDto {
  _id: ObjectId;
  folio: string;
  monto_total: number;
}
```

---

## 3. Guía Funcional: Implementación en Flujo de Trabajo

La estandarización del archivo DTO fuerza al resto del flujo MVC-S a ser resiliente:

1. **Controller**: Importa los DTOs de Inserción (`CreateRecursoDto`, `UpdateRecursoDto`). Tipa los parámetros de entrada y facilita el autocompletado y validaciones lógicas preliminares.
2. **Service**: Importa tanto Tipos de entrada como la Entidad Base. Transforma (cast) un `CreateRecursoDto` en un objeto compatible en BD que cumpla la interfaz principal, inyectándole lógica de negocio (como generar timestamps `creationDateTS`).
3. **Model / Repositorio MongoDB**: Declara los genéricos de sus operaciones a través de los DTOs.
   ```typescript
   const dbRef = db.collection<RecursoBase>("nombre_coleccion");
   ```
   Gracias a esto, TypeScript bloquea en etapa transaccional (pipeline) si un desarrollador falla al invocar un nombre de columna en `$match` o olvida declarar campos requeridos al invocar un `insertOne()`.

# Guía Técnica: Diseño y Configuración de la Capa Model (Modelos de Recursos)

La capa Model en la arquitectura MVC-S es la encargada exclusiva de la persistencia de datos. Actúa como el Repositorio de Acceso a Datos (Data Access Object) aislando completamente al Service de los drivers originarios de la base de datos (en este caso, MongoDB).

A continuación, se detalla la configuración, funcionalidad y el estándar de diseño agnóstico para la construcción y estructuración de los Modelos (archivos `<modulo>Model.ts`) correspondientes a módulos de recursos (como documentos, facturas, clientes, etc.).

---

## 1. Responsabilidad de la Capa Model

El archivo `<modulo>Model.ts` provee funciones puras y asíncronas para gestionar la información empírica de la base de datos. Sus responsabilidades son estrictas:

1. **Acceso a la Base de Datos:** Establecer la conexión con el motor persistente y apuntar a la base y colección precisa.
2. **Ejecutar Consultas (Queries):** Realizar inserciones, actualizaciones, borrados y lecturas usando los drivers correspondientes.
3. **Mapeo Tipado de BD:** Utilizar los DTOs exportados de la capa DTO (ej. genéricos en base `db.collection<EntidadBase>`) para garantizar que la petición cumpla en origen la estructura.
4. **Transformación Relacional (Agregaciones):** Ejecutar proyecciones (`$project`), cruces (`$lookup`) y cálculos directos de base de datos antes de devolver la data bruta a la memoria de Node.js.

### ¿Qué NO hace la Capa Model?

- **No contiene Lógica de Negocio ni Autorizaciones.** (No sabe si el usuario es un Admin o un Auxiliar, ni emite correos electrónicos. Sólo acepta parámetros estandarizados).
- **No define Estructuras de Petición HTTP.**

---

## 2. Estructura Estándar de un Archivo Model

Todo Modelo de recurso habitualmente obedece la siguiente segmentación de funciones:

### A. Dependencias y Colección Puntero

El archivo importa las configuraciones estáticas de base de datos, el gestor de errores y las interfaces de dominio del archivo DTO homónimo. Se establece el nombre de la colección en una constante para evitar faltas de ortografía (typos).

```typescript
import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import {
  EntidadBase,
  UpdateEntidadDto,
  GetAllEntidadesFilters,
  PaginacionRespuesta,
} from "./entidadDto";

const COLLECTION = "entidades";
```

### B. Funciones Transaccionales Directas (CRUD)

Exponen la creación, lectura sencilla, eliminación y actualización estricta. Todo evento se encierra en un `try/catch` nativo para estandarizar excepciones.

**Implementación general CRUD:**

```typescript
export async function createEntidadMongo(entidad: EntidadBase) {
  try {
    const db = await connect();
    const dbRef = db.collection<EntidadBase>(COLLECTION);
    return await dbRef.insertOne(entidad);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createEntidadMongo");
  }
}

export async function getEntidadById(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<EntidadBase>(COLLECTION);
    return await dbRef.findOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getEntidadById");
  }
}

export async function updateEntidadMongo(id: string, data: UpdateEntidadDto) {
  try {
    // Garantizar tipado UpdateEntidadDto permite evitar sobrescritura de llaves foráneas
    const db = await connect();
    const dbRef = db.collection<EntidadBase>(COLLECTION);
    return await dbRef.updateOne({ _id: getMongoId(id) }, { $set: data });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateEntidadMongo");
  }
}
```

### C. Listados Complejos y Paginación Estándar (`getAllMongo`)

La función de lectura en masa soporta siempre el parámetro `Filters` proveniente del DTO, interpretándolo para crear las querys y la cuenta total de documentos concurrentemente (`Promise.all`).

```typescript
export async function getAllEntidadesMongo(
  filters: GetAllEntidadesFilters,
): Promise<PaginacionRespuesta<EntidadBase>> {
  try {
    const db = await connect();
    const dbRef = db.collection<EntidadBase>(COLLECTION);
    const query: any = {};

    // 1. Filtrados exactos
    if (filters.id_padre) query.id_padre = filters.id_padre;

    // 2. Filtrado Regex (Buscador general)
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, "i");
      query.$or = [{ folio: searchRegex }, { nombre: searchRegex }];
    }

    // 3. Variables de partición (Paginación)
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    // 4. Múltiples promesas para rendimiento óptico
    const [totalItems, data] = await Promise.all([
      dbRef.countDocuments(query),
      dbRef
        .find(query)
        .sort({ creationDateTS: -1 }) // Orden descendente por default
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    // Retorno acoplado al DTO Transversal
    return {
      data: data as EntidadBase[],
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllEntidadesMongo");
  }
}
```

### D. Agregaciones y Modificaciones Atómicas Avanzadas

El driver debe usarse intensivamente para evitar sobrecargar a Node.js de cálculos.

**Ejemplo 1. `Pipelines` y `Lookups` (Joins):**
Utilizar `$lookup` dentro de una pipeline `.aggregate()` para popular o combinar llaves foráneas de otras colecciones.

```typescript
{
  $lookup: {
    from: "padres", // Alias colección foránea
    localField: "id_padre",
    foreignField: "uid",
    as: "detalles_padre"
  }
}
```

**Ejemplo 2. Modificaciones Atómicas Parciales:**
Funciones de único propósito que actualicen ramas profundas, metadatos, o hagan `$push` en arrays sin invocar el `UpdateDto` completo. Ideal para inyectar actualizaciones lógicas rápidas.

```typescript
export async function pushCambioDeEstadoMongo(
  id: string,
  nuevoEstado: string,
  logHistorico: ObjetoLog,
) {
  const db = await connect();
  const dbRef = db.collection<EntidadBase>(COLLECTION);

  return await dbRef.updateOne(
    { _id: getMongoId(id) },
    {
      $set: { estado: nuevoEstado },
      $push: { historico_estados: logHistorico },
    },
  );
}
```

---

## 3. Normativa Crítica en el Catch Integrado

Absolutamente cualquier error desprendido del driver debe ser atrapado por el bloque `catch (error)` e instanciarse a través de la clase enrutadora de alertas: `throw new BaseError(...)`

1. **Traza del Error Estricta:** El constructor exige un tercer parámetro donde se debe forzar la colocación del "NombreExactoDeLaFuncion", permitiendo que los sistemas de rastreo localicen en cuál query fracasó la arquitectura sin leer tediosos Stack Traces.

```typescript
} catch (error) {
  // Patrón obligatorio. No modificar.
  throw new BaseError("Inside catch: ", error, "NombreDeLaConsultaPrecisa");
}
```

# Guía Técnica: Diseño y Configuración de la Capa de Servicios

La capa de Servicio (`Service`) es el corazón de la arquitectura MVC-S. Actúa como el orquestador absoluto de la lógica de negocio y los casos de uso para los módulos de recursos (documentos, facturas, clientes, productos, etc.).

A continuación, se detalla la configuración, funcionalidad y el estándar de diseño agnóstico para la construcción y estructuración de los Servicios (`<modulo>Service.ts`), dictando exactamente qué tipo de procesamiento debe realizarse antes de delegar tareas a la base de datos o retornar respuestas al Controlador.

---

## 1. Responsabilidad de la Capa de Servicio

A diferencia del Controlador (que solo maneja Requests y Responses HTTP) y del Modelo (que solo efectúa queries crudos), el Servicio contiene el **"Cómo"** de la plataforma.

Sus responsabilidades inquebrantables son:

1. **Ejecutar Reglas de Negocio:** Validar estados previos, comprobar disponibilidades y generar lógicas complejas antes de insertar o borrar un dato.
2. **Transformación y Enriquecimiento de Datos:** Ensamblar objetos completos (instanciar genéricos como `ObjectId`, autogenerar campos calculados como `folios` particulares).
3. **Orquestación de Múltiples Modelos:** Si crear un recurso exige registrar o verificar datos en otros módulos, el Servicio coordina dicha interacción.
4. **Disparar Efectos Secundarios (Side-Effects):** Centraliza la emisión de tareas de observabilidad o alertas transversales a la aplicación:
   - Registro de Trazabilidad (`Logs`).
   - Impactos Analíticos (`Métricas`).
   - Disparo de Correos y Notificaciones.

### Contexto del Solicitante (`currentUser`)

La mayoría de las mutaciones (Create, Update, Delete) en un Servicio exigen recibir obligatoriamente como parámetro la referencia al usuario en sesión temporal proporcionada por el middleware de autenticación (frecuentemente tipeado como `currentUser: any` o la interfaz nativa del `req.user`). Esto permite dotar de autoría real a los side-effects.

---

## 2. Estructura Estándar de un Archivo Service

Todo Servicio de recursos se compone habitualmente de las siguientes fases secuenciales al atender un bloque lógico (ej. al procesar una petición "CREATE").

### A. Dependencias e Inyecciones

El Servicio importa estrictamente su Modelo asociado, los DTOs para tipar parámetros, el manejador de Errores y las utilerías transversales de la plataforma.

```typescript
import * as model from "./recursoModel";
import { CreateRecursoDto, UpdateRecursoDto } from "./recursoDto";
import { BaseError } from "../../shared/classes/base-error";
import { HttpStatusCode } from "../../shared/models/http.model";
import { ObjectId } from "mongodb";

// Librerías estáticas Transversales Obligatorias
import { registrarLog } from "../logs/logsService";
import { registrarMetrica } from "../metrics/metricsService";
import { createNotificacion } from "../notificaciones/notificacionesService";
```

### B. Funciones de Lectura (Queries Planos)

Frecuentemente, el servicio funciona como un mediador plano (passthrough) para las búsquedas genéricas delegando instantáneamente al Modelo, a menos que se requiera pre-formatear algún filtro.

```typescript
export async function getRecursos(filters: GetAllRecursosFilters) {
  try {
    return await model.getAllRecursosMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getRecursos");
  }
}
```

### C. Fase Lógica: Creación (Create)

El flujo clásico de creación requiere validaciones asincrónicas a otras colecciones (ej. Cuentas Contables), la inyección de metadatos automáticos y finalizar disparando las alertas.

```typescript
export async function createRecurso(form: CreateRecursoDto, currentUser: any) {
  try {
    // 1. Verificaciones / Restricciones de Reglas de Negocio
    // Ej: Consultar un servicio hermano si una precondición existe
    const cuentaPadre = await otroServicio.getCuentaPadre(form.entidad_id);
    if (!cuentaPadre) {
      throw new BaseError(
        "Config Error",
        "Falta la configuración de padre antes de crear el recurso",
        "createRecurso",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // 2. Enriquecimiento de Datos (Cálculos internos)
    const folioGenerado = `REC-${cuentaPadre.identificador}-${form.codigo}`;

    const entidadCompleta = {
      _id: new ObjectId(),
      ...form, // Extracción de datos tipados aprobados por el DTO
      folio: folioGenerado, // Valor auto-calculado
      estado: "ACTIVO", // Defaults de negocio
      creationDateTS: new Date().getTime(),
    };

    // 3. Inserción (Delegando finalmente al Modelo Puro)
    const mongoResponse = await model.createRecursoMongo(entidadCompleta);

    // 4. Disparo de Side-Effects concurrentes (Logs, Métricas)
    registrarLog({
      usuario_id: currentUser.uid,
      rol_usuario: currentUser.role,
      descripcion: `Creación de recurso manual: ${form.nombre} (Folio: ${folioGenerado})`,
      tipo_accion: "CREAR",
      entidad_afectada: "RECURSO_DOMINIO",
      id_contribuyente: form.id_proveedor,
    });

    registrarMetrica("RECURSOS", form.id_proveedor, form.monto_total, 1);

    // Retorno exclusivo del identificador para uso del Controller
    return mongoResponse.insertedId;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createRecurso");
  }
}
```

### D. Fase Lógica: Actualización (Update Mutativo)

En operaciones cruzadas, como actualizaciones, el servicio debe recuperar la entidad actual de base de datos (`estado T0`) para compararla con el requerimiento de mutación (`estado T1`) y deducir los diferenciales matemáticos de una métrica, o detener el borrado si su ciclo de vida activo se lo prohíbe.

```typescript
export async function updateRecursoMonto(
  id: string,
  data: UpdateRecursoDto,
  currentUser: any,
) {
  try {
    // 1. Leer el estado actual previo a la mutación para cálculos diferenciales
    const recursoActual = await model.getRecursoById(id);
    if (!recursoActual)
      throw new BaseError("Not found", "Recurso no encontrado", "update", 404);

    // 2. Delegar la inserción
    const mongoResponse = await model.updateRecursoMongo(id, data);

    // 3. Auditoría e Impactos Aritméticos
    if (mongoResponse.modifiedCount > 0) {
      registrarLog({
        usuario_id: currentUser.uid,
        rol_usuario: currentUser.role,
        descripcion: `Actualización de monto del recurso: ${id}`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "RECURSO_DOMINIO",
      });

      // Condicional crucial: Analizar si las matemáticas de las Métricas requieren corrección
      if (data.monto_total !== undefined) {
        const diferencia = data.monto_total - recursoActual.monto_total;
        if (diferencia !== 0) {
          // Registrar solo la variante, no el total completo.
          registrarMetrica(
            "RECURSOS",
            recursoActual.id_proveedor,
            diferencia,
            0,
          );
        }
      }
    }

    return mongoResponse.modifiedCount > 0;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateRecursoMonto");
  }
}
```

---

## 3. Normativas Críticas en Capa de Servicio

1. **Atentados de Estado:** Todo control de flujo que fracase por colisión de lógica (ej. Intento de eliminar una _Factura_ con _Pagos Parciales_) debe emitir un `throw new BaseError` argumentando con un código HTTP estándar de semántica de negocio (ej. `409 CONFLICT` o `400 BAD REQUEST`), de esta manera la cadena explota y no continúa ejecutando código en el resto de la promesa original.
2. **Rehúso de Código:** Si varias ramificaciones mutativas deben aplicar la misma regla o lógica calculada (ej. `createCuentaIfNotExists`), estas deben declararse como funciones asíncronas de ayuda (helpers internos) y **no exportarse** en el servicio principal o repetirse, aliviando la visibilidad pública.
3. **Manejo de Respuestas de Driver:** Todas las operaciones mutativas del Modelo devuelven al Servicio objetos integrados nativos del driver (ej. `UpdateResult`, `InsertOneResult`). El Servicio evalúa los estados lógicos devueltos (ej. validar si `mongoResponse.modifiedCount > 0`) para recién entonces ejecutar o no los side-effects.
4. **Propagación BaseError Inamovible:** Al igual que el modelo, cualquier falla o caída de código interna no manejada caerá de golpe en el enrutamiento general, instanciando `throw new BaseError("Inside catch: ", error, "NombreDeLaFuncionDeServicioExplotada")`.

# Guía Técnica: Diseño y Configuración de la Capa de Controladores

La capa de Controlador (`Controller`) es la capa de entrada inmediata después de que una petición HTTP ("Request") supera el enrutador (`Router`) y los middlewares de seguridad. Actúa como el puente estricto de traducción entre el protocolo Web (Express) y la lógica abstracta del backend (Servicios).

A continuación, se detalla la configuración, funcionalidad y estándar de diseño agnóstico para la construcción y estructuración de los Controladores (`<modulo>Controller.ts`) para cualquier módulo de recursos.

---

## 1. Responsabilidad de la Capa de Controlador

La filosofía principal de un controlador en esta arquitectura es que debe ser "tonto" respecto a la lógica de negocio. Sus responsabilidades están acotadas exclusivamente a las siguientes tareas:

1. **Recepción HTTP:** Extraer los datos enviados por cliente:
   - `req.query`: Variables incrustadas en la URL (Paginación, filtros).
   - `req.params`: Identificadores directos de ruta (ej. `/recursos/:uid`).
   - `req.body`: La carga útil (Payload) de mutaciones POST/PUT.
   - `req.user`: Metadatos del emisor inyectados previamente por el Middleware de Autenticación.
2. **Validación Superficial (Sanity Checks):** Comprobar que los parámetros vitales para la ejecución existan (no nulos) antes de molestar al `Service`.
3. **Delegación Estricta:** Pasar los datos extraídos (previamente limpiados o parseados si es necesario) a la función correspondiente del `Service`.
4. **Respuestas Estandarizadas (Payload Response):** Formatear y emitir el `200 OK` (HTTP Status) junto a la envoltura oficial del sistema.
5. **Enrutamiento de Errores Global:** Recoger cualquier excepción del `Service` y enviarla mediante `next(error)` al "Error Handler" general de Express.

### ¿Qué NO hace la Capa de Controlador?

- **No ejecuta sentencias SQL/MongoDB**, ni invoca colecciones o drivers lógicos.
- **No arroja cálculos, restas, ni inyecta folios o llaves asíncronas.**
- **No arroja `res.status(500)` explícitos**. El bloque genérico maneja eso.

---

## 2. Estructura Estándar de un Archivo Controller

Todo archivo Controller de un módulo encapsula cada servicio en un método equivalente y asíncrono con el "signature" requerido por Express.js.

### A. Dependencias Invariables

Todo controlador importa Express, el Servicio homónimo, los Enums de Tipado Globales y la clase principal transaccional de manejo de Errores API.

```typescript
import express, { NextFunction } from "express";
import * as service from "./recursoService";

// Helpers Transversales Oficiales
import { HttpStatusCode } from "../../shared/models/http.model";
import { ParametersError } from "../../shared/classes/api-errors";
import { GetAllRecursosFilters } from "./recursoDto";
```

### B. Funciones de Lectura Masiva (`getAll` o Similares)

El controlador formatea el `req.query` nativo de HTTP (donde todo viene tipado como `string`) hacia el DTO correspondiente que exige el servicio, aplicando conversiones aritméticas como parseInt (`parseInt`) donde sea forzoso.

```typescript
export async function getRecursosController(
  req: express.Request,
  res: express.Response,
  next: NextFunction,
) {
  try {
    // 1. Extracción y Cast Tipado de Query Strings al DTO Filtros
    const filters: GetAllRecursosFilters = {
      search: req.query.search as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
      fechaInicio: req.query.fechaInicio
        ? parseInt(req.query.fechaInicio as string)
        : undefined,
      fechaFin: req.query.fechaFin
        ? parseInt(req.query.fechaFin as string)
        : undefined,
      id_padre: req.query.id_padre as string,
    };

    // 2. Delegación a Servicio
    const serviceResponse = await service.getRecursos(filters);

    // 3. Respuesta JSON Uniforme
    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "Recursos obtenidos",
      data: serviceResponse,
    });
  } catch (error) {
    // 4. Delega a Middleware Error
    next(error);
  }
}
```

### C. Funciones de Mutación Inyectando Contexto (Create/Update)

Durante las operaciones de mutación, el controlador se encarga de extraer la pieza original del `req` y el valioso contexto inyectado del token en `req.user`.

```typescript
export async function createRecursoController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const payload = req.body;
    const currentUser = req.user; // Contexto autenticado

    // Sanity Check Superficial. (¿Tiene el ID vital para continuar?)
    // Opcionalmente: Podría implementarse validación con schemas (ej. Zod/Joi) en este punto.
    if (!payload || !payload.id_padre) {
      throw new ParametersError(
        "Faltan parámetros",
        "Cuerpo de la petición o [id_padre] vacíos",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // El servicio orquestará qué hacer
    const serviceResponse = await service.createRecurso(payload, currentUser);

    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "Recurso creado exitosamente",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}
```

### D. Búsquedas y Borrados de Parámetros Simples Específicos (`req.params`)

El código que procesa información referenciada directamente por el URI (ej. `.../recursos/delete/1A2B3D`) extrae el parámetro y asegura que no esté vacío antes de delegar.

```typescript
export async function deleteRecursoController(
  req: express.Request | any,
  res: express.Response,
  next: NextFunction,
) {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Sanity Check Superficial. No dejar que el servicio colapse por Undefined.
    if (!id) {
      throw new ParametersError(
        "Missing id param",
        "deleteRecurso",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const serviceResponse = await service.deleteRecurso(id, currentUser);

    res.status(200).send({
      status: HttpStatusCode.OK,
      message: "Recurso eliminado",
      data: serviceResponse,
    });
  } catch (error) {
    next(error);
  }
}
```

---

## 3. Normativas Críticas en Capa de Controlador

1. **Respuesta Transversal Siempre 2xx (Éxito Lógico):** A nivel controlador, todas las promesas finalizadas sin activar el bloque `catch` deben obligatoriamente devolver un Status Code positivo (generalmente `200 OK`). Todo error y lógica de rechazo se maneja por medio de lanzamientos estructurados (`throw`) atrapados en los bloques de Error base.
2. **Propósito del Error ParametersError:** A diferencia de `BaseError` (Reservado para transacciones de negocio o base de datos), el `ParametersError` es un error exclusivo para el Controller si descubre falencias superficiales o semánticas (ej. se manda letras paramétricas donde se pide un número). Lanza devoluciones tempranas usando el estatus estándar (comúnmente `400 BAD REQUEST`).
3. **El Infranqueable Bloque Único Try/Catch:** La estructura exige solo un par anillador `try/catch` por método. No debe haber `try/catch` anidados ni respuestas perdidas en callbacks, garantizando de esta manera un flujo "Early Return" limpio en la captura de fallos o el uso correcto del `next()`.
4. **Estructura Envelope:** Sin importar el módulo, todo envío hacia el Frontend siempre sigue la forma `{ status: numerico, message: string, data: object_o_array_del_servicio }`. Jamás un controlador responde texto puro `res.send("Exito")` o data cruda `res.json(serviceResponse)`.

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

# Guía Técnica: Módulo Transversal de Logs (Auditoría e Historial)

En la arquitectura del ecosistema MVC-S, el módulo de **Logs** (`src/api/logs`) juega un rol excepcionalmente distinto al resto de los recursos. No es un módulo cuyo propósito principal sea mutado por los usuarios a través del cliente, sino que opera como un **Módulo Transversal (Cross-Cutting Concern)**.

Su responsabilidad es documentar, trazar y almacenar la vida de las operaciones críticas realizadas en la plataforma de manera agnóstica a qué entidad esté sufriendo dicho cambio. A continuación, se detalla su comportamiento, naturaleza asincrónica y cómo acoplarlo limpiamente a cualquier nuevo servicio de la aplicación.

---

## 1. Responsabilidad y Naturaleza del Módulo Logs

La diferencia arquitectónica de este módulo radica en su posición pasiva dentro del flujo de Controladores. Nadie lanza peticiones `POST /api/logs/create` de manera explícita en el _Frontend_. En su lugar, el módulo se engancha internamente al final de otras transacciones mediante programación orientada a "Efectos Secundarios" (_Side-Effects_).

Sus objetivos principales son:

1. **Auditoría Estricta:** Responder al _Quién_ (usuario*id, rol_usuario), \_Qué* (tipo*accion, descripcion), \_Cuándo* (fecha) y sobre _Quién_ (entidad_afectada, id_padre).
2. **Registro de Fallos Lógicos:** Trazar cuando un usuario comete acciones restrictivas con fallos lógicos no atrapados o deliberados.
3. **No Bloquear el Flujo Principal:** La grabación de historias es indispensable, pero no puede sumar milisegundos de latencia a las funciones principales ni hacer fallar al Controlador si la base de datos de logs sufriera intermitencias.
4. **Alimentación Métrica Oculta:** Almacenar logs acciona a su vez componentes hermanos (como el disparador de Métricas o Stats), encadenando su flujo pasivamente.

---

## 2. El Modelo DTO de Registro (`CreateLogDto`)

Para que un módulo principal le notifique de algo a los Logs, debe cumplir un contrato estandarizado con el `logsDto.ts`. Este es el molde esperado:

```typescript
export interface CreateLogDto {
  descripcion: string; // Texto narrativo. Ej: "Actualización de monto de Factura X"
  id_despacho?: string; // Llave foránea macro si aplicara
  nombre_despacho?: string; // (Opcional - desnormalización)
  id_contribuyente?: string; // Llave foránea media si aplicara
  nombre_contribuyente?: string; // (Opcional - desnormalización)
  usuario_id: string; // OBLIGATORIO: El ejecutor extraíble del req.user
  nombre_usuario?: string;
  rol_usuario: string; // OBLIGATORIO: Jerarquía de quien disparó la mutación
  tipo_accion?: string; // Ej: "CREAR", "ESCRITURA", "BORRADO"
  entidad_afectada?: string; // Ej: "USUARIOS", "RECURSO_DOMINIO"
}
```

---

## 3. Implementación: Patrón Fire and Forget

El mayor aspecto técnico de la capa `Service` del módulo Logs, es que está fabricado especialmente para **no esperar por la base de datos**.

Al examinar su `logsService.ts`, vemos este patrón arquitectónico:

```typescript
// logsService.ts
export async function registrarLog(dto: CreateLogDto) {
  try {
    const nuevoLog: LogActividad = { ...dto, fecha: new Date() };

    // EXTREMADAMENTE IMPORTANTE:
    // No usamos 'await'. Si Mongo tarda en guardar el log, el usuario no debe esperar.
    model.createLogMongo(nuevoLog).catch(err => console.error("Fallo log:", err));

    // Despliegue de métricas hermano
    if (companyId) registrarMetrica('LOGS', companyId, 0, 1);

    return true; // Retorna true sincrónicamente inmediato
  } catch (error) { ... }
}
```

Y del lado del modelo también sufre un trato de inmunidad: si el Insert de Mongo fracasa, se absorbe el error (`return null;`) pero jamás lanza un `throw new BaseError` para no matar la respuesta HTTP que generó la acción principal.

---

## 4. ¿Cómo utilizar el Módulo Logs desde otros Servicios?

Siempre que crees un módulo nuevo (Ejemplo: `VehiculosService`), es mandatorio invocar el loguero al finalizar una mutación importante.

### Paso 1: Importar la utillería

En tu nuevo archivo de lógica (`<modulo>Service.ts`), importa directamente el método público del sistema de Auditoría:

```typescript
import { registrarLog } from "../logs/logsService";
```

### Paso 2: Invocar tras la inserción en Base de Datos

Dentro del bloque exitoso de actualización o creación, extrayendo el `currentUser` propagado por tu controlador:

```typescript
// En tu archivo moduloService.ts
export async function deleteVehiculo(id: string, currentUser: any) {
  const deletedCount = await model.deleteVehiculoMongo(id);

  if (deletedCount > 0) {
    // Ejecución "Fire-and-Forget": No usar `await` delante.
    registrarLog({
      usuario_id: currentUser.uid, // De Authentication Middleware
      rol_usuario: currentUser.role, // De Authentication Middleware
      tipo_accion: "BORRADO",
      entidad_afectada: "VEHICULOS",
      descripcion: `Eliminó el vehículo con placa ${id}`,
      id_contribuyente: req.padre_id, // Contexto foráneo de la tabla
    });
  }

  return true;
}
```

---

## 5. El Sistema de Lectura (El Controlador y Ruta de Lectura)

Aunque la inserción es pasiva y se realiza desde el backend profundo sin rutas asociadas a un POST, la **Lectura** de logs sí está gobernada por Controladores y Rutas convencionales (`GET /api/logs/get-all`).

Para este flujo, el modelo `logsModel.ts` despliega una arquitectura agresiva de los llamados **Agrupadores (Aggregation Pipelines)**.
Debido a que el Log guarda sólo identificadores puros, el `getLogsMongo()` lanza masivos y dinámicos `$lookup` cruzados nativamente en MongoDB hacia todas las tablas interconectadas:

1. Busca al responsable en los administradores.
2. Si no es, busca en los roles medios.
3. Si no es, busca en los miembros hoja.
4. Une los datos encontrados en una proyección final `$project`.

Esto se le entrega al Fron-End con un `PaginacionRespuesta` altamente tipado.

### Resumen Arquitectónico:

- **El Router (`logs.routes.ts`)**: No tiene verbo `POST` libre, y sus verbos `GET` están limitados obligatoriamente a Super-Administradores y personal técnico que deban revisar las auditorías (no el público en general).
- **El Controlador (`logsController`):** Encapsula el casteo de variables de filtro (ej. Rango de Fechas e IDs responsables) limitando el alcance.
- **El Modelo (`logsModel`):** Inserta muda y asíncronamente en escrituras. Ensambla reportes masivos costosos durante lecturas.

# Guía Técnica: Módulo Transversal de Métricas y Analíticas (`Metrics`)

Al igual que el sistema de Auditoría (`Logs`), el módulo de **Métricas (`src/api/metrics`)** opera como un **Módulo Transversal (Cross-Cutting Concern)** en la arquitectura MVC-S. Su función es reaccionar en segundo plano para procesar, agrupar y almacenar cálculos matemáticos que alimentarán los _Dashboards_ y reportes gerenciales (KPIs) de las distintas aplicaciones del ecosistema.

Su existencia evita que, al solicitar un reporte mensual, el Controlador tenga que escanear miles de facturas o documentos para sumar sus saldos o contar sus impactos. Toda matemática es calculada y guardada progresivamente (`Pre-Aggregated Data`).

---

## 1. Responsabilidad y Filosofía del Módulo Metrics

1. **Pre-Agregación Rápida:** Transforma mutaciones diarias en sumatorias fijas. Acumular en tiempo real mediante _Upserts_ atómicos previene cuellos de botella al leer históricos.
2. **Escalabilidad Temporal:** Aglomera la información en cajas de tiempo (_Buckets_) predecibles: Diario, Semanal, Mensual, Global e inter-anual.
3. **Paternidad Asincrónica (Fire and Forget):** Al igual que `Logs`, la grabación de una métrica jamás de usa con un `await` en el flujo principal de otro Controlador. Si falla, el usuario no debe percibir retrasos.
4. **Agnosticidad Dimensional:** El módulo no necesita saber si está guardando "Pesos", "Personas", "Ventas" o "Terabytes". Para el módulo, todo se resume en un Contexto (`context`), un Valor monetario/crítico (`value`) y un Conteo o cantidad absoluta (`count`).

---

## 2. El Modelo de Almacenamiento Cúbico (`Analytics`)

El módulo asienta sus datos en una colección genérica (`analytics`). Su estructura está diseñada para aguantar toda la biografía de un año entero dentro de un solo registro documental en MongoDB, gracias a un mapa multidimensional.

```typescript
export interface Analytics {
  _id: string; // Formato: CONTEXTO_CompaniaId_AÑO (Ej. INGRESOS_65b32xx_2026)
  context: string; // Agrupador semántico: 'FACTURAS', 'CLIENTES', 'INGRESOS'
  companyId: string; // Dueño de los datos
  year: number; // Caja (Bucket) Anual
  // Cajas temporales apilables
  global: { count: number; value: number }; // Total del Año
  monthly: Record<string, { count: number; value: number }>; // { "1": {...}, "12": {...} }
  weekly: Record<string, { count: number; value: number }>; // { "1": {...}, "52": {...} }
  daily: Record<string, { count: number; value: number }>; // { "1": {...}, "365": {...} }
}
```

---

## 3. Implementación: Motor de Grabado Atómico (`$inc`)

El corazón de `metricsService.ts` basa su eficiencia en el comando atómico `$inc` de MongoDB. En lugar de extraer el documento, sumar el valor y volver a guardarlo (lo que causaría colisiones concurrentes), envía la semilla matemática para que el Motor de BD lo resuelva.

```typescript
// extracto de metricsService.ts
const docId = `${context}_${companyId}_${year}`; // ID Determinístico Único
const updateOperation = {
  $setOnInsert: { context, companyId, year, createdAt: new Date() },
  $inc: {
    "global.count": countChange,
    "global.value": amountChange,
    [`monthly.${month}.count`]: countChange,
    [`monthly.${month}.value`]: amountChange,
    [`weekly.${week}.count`]: countChange,
    [`weekly.${week}.value`]: amountChange,
    [`daily.${day}.count`]: countChange,
    [`daily.${day}.value`]: amountChange,
  },
};

await updateAnalyticsMetricMongo(docId, updateOperation); // Upsert (Inserta o Actualiza en un golpe)
```

Si el documento del año en curso no existe, las operaciones bajo `$setOnInsert` crean el encabezado. Simultáneamente, el `$inc` suma las matemáticas proporcionadas de `count` y `value` simultáneamente en el `global`, `monthly`, `weekly` y `daily`.

---

## 4. ¿Cómo utilizar y registrar métricas desde otros módulos?

La función inyectora de métricas se expone al final de `metricsService.ts` como un cascarón _Fire-and-Forget_ puro protegido por un `.catch`.

### El Puntero de Inyección:

```typescript
export function registrarMetrica(
  context: string, // Etiqueta del bucket (Ej: 'FACTURASYPAGOS', 'CLIENTES_NUEVOS', 'USUARIOS')
  companyId: string, // UUID del dueño / padre
  amount: number = 0, // 0 Si la métrica no es monetaria, de lo contrario la cantidad
  count: number = 1, // Las unidades. Ej. 1 Factura Creada, o -1 Si fue eliminada.
);
```

### Paso 1: Importar la utillería en el modulo origen

En archivo de lógica origen (`<modulo>Service.ts`), importa el helper al igual que con los Logs:

```typescript
import { registrarMetrica } from "../metrics/metricsService";
```

### Paso 2: Invocar a favor (Crear/Sumar) y en contra (Borrar/Descontar)

El módulo Metrics asimila números negativos. Eso es crucial durante modificaciones.

**Ejemplo 1: Simplemente contar nuevas entidades (Ej. Creado un cliente):**

```typescript
// clientesService.ts -> createCliente
registrarMetrica("CLIENTES", form.id_contribuyente, 0, 1);
```

**Ejemplo 2: Registrar una creación con impacto económico (Ej. Nueva Factura por $1,500):**

```typescript
// facturasService.ts -> createFactura
// context, dueño, valor_monetario, cantidad_de_facturas
registrarMetrica(
  "FACTURAS",
  factura.contribuyente_id,
  factura.xml_data.total,
  1,
);
```

**Ejemplo 3: Registrar matemáticamente la Modificación (Updates Económicos):**
Al actualizar cantidades y saldos, NO puedes mandar el nuevo saldo total, debes mandar **el Diferencial Matemático (`new_math - old_math`)** para que se aplique como un parche al total que Mongo está acumulando.

```typescript
// facturasService.ts -> updateStatus o Pago
const facturaActual = await model.getFacturaById(id);
const diferencia = dataCarga.monto_nuevo - facturaActual.monto_anterior;

if (diferencia !== 0) {
  // Si la diferencia es de $-500 pesos, MongoDB hará global += -500
  // "Monto a inyectar" = diferencia.   "Impacto al count (cuántas entidades)" = 0
  registrarMetrica("EGRESOS", facturaActual.contribuyente_id, diferencia, 0);
}
```

**Ejemplo 4: Eliminar transacciones:**
Si se borra una factura en el sistema, debe borrarse de la gráfica métrica anual.

```typescript
// facturasService.ts -> deleteFactura
const viejaData = await model.getFacturaById(id);
// Monto a inyectar negativo, y -1 a cantidad (count) local.
registrarMetrica(
  "FACTURAS",
  viejaData.contribuyente_id,
  -viejaData.xml_data.total,
  -1,
);
```

---

## 5. Extracción y Agrupación Selectiva (`MainDashboardStats`)

Cuando un Panel Front-End necesita desplegar KPIs mediante GET requests desde su Router (`/api/metrics/dashboard`), el controlador invoca métodos potentes de extraccion pre-ensamblados que hacen uso explícito de `metricsUtils.ts`.

Éste utilitario transversal le permite a `Metrics` inyectar funciones lógicas exclusivas:

- `calculateVariation()`: Descubre si la variación comparada con la caja temporal anterior (`prev key`) es positiva o negativa.
- `getWeekNumber()`, `getDaysInWeek()`: Calcula semanas o días ISO a inyectar al Chart.

A nivel de servicio (`metricsService.fetchAndAggregate`), debido a los requerimientos de la Jerarquía de Permisos de tu ecosistema, si el administrador solicita ver un panel superior, el servicio lanzará un arreglo `$in` de bases de MongoDB absorbiendo a múltiples despachos y unificando en una mega métrica los montos de todos reduciéndolos de nuevo al molde del Cubo Multidimensional.

# Guía Técnica: Módulo Transversal de Notificaciones (`Notificaciones`)

El módulo de **Notificaciones (`src/api/notificaciones`)** funciona como un **Módulo Transversal (Cross-Cutting Concern)** con comportamiento de servicio mixto. A diferencia de `Logs` o `Metrics` (que operan única y exclusivamente en el backend silencioso), el sistema de notificaciones tiene un impacto **doble**:

1. Persiste alertas lógicas en Base de Datos para que el Front-End las consuma (La clásica "Campanita" de avisos).
2. Es un disparador activo en tiempo real mediante **Push Notifications (Firebase Cloud Messaging - FCM)** al dispositivo o navegador del cliente.

A continuación, se detalla su funcionamiento, la estructura de sus DTOs y el procedimiento agnóstico para que cualquier otro recurso dispare alertas usando este servicio.

---

## 1. Responsabilidad y Filosofía del Módulo

1. **Mensajería Omnicanal:** Su misión principal es informar a los clientes o técnicos sobre eventos vitales de la plataforma (Ej. _Cotización Aprobada_, _Factura Vencida_, _Proceso Finalizado_).
2. **Persistencia de Estados:** Garantiza el almacenamiento íntegro de la alerta hasta que el usuario decida leerla. Permanece en el buzón estructurado.
3. **Comunicación Push Inmediata:** Orquesta la interconexión con Firebase. Durante cada inserción, el módulo contacta a la tabla de Tokens de dispositivos (`fcm_tokens`) para descubrir la firma del celular o PC de la víctima y hacerle vibrar la pantalla en tiempo real sin esperar.
4. **Auto-Auditoría:** Curiosamente, el módulo de notificaciones despacha a la vez su propio comportamiento hacia los `Logs` (Registrando "Se creó una notificación a Juan").

---

## 2. El Modelo de Contrato y Categorización (`notificacionesDto`)

Para disparar una alerta estructurada, el módulo exige un DTO con categorización. El esquema categorizado permite que la interfaz gráfica divida los avisos en pestañas y les asigne íconos de color dependiendo su severidad o contexto.

### Tipos y Categorías Obligatorias:

```typescript
export enum TipoNotificacion {
  INFO = "INFO", // Informativa (Tipicamente iconos azules)
  ELIMINAR = "ELIMINAR", // Acciones destructivas o advertencias (!)
  SUCCESS = "SUCCESS", // Acción completada (Icono verde)
  ERROR = "ERROR", // Fallas del sistema (Icono rojo cruz)
}

export enum CategoriaNotificacion {
  FISCAL = "FISCAL", // Alertas contables (Vencimientos)
  SISTEMA = "SISTEMA", // Mantenimientos o cambios de contraseña
  GENERAL = "GENERAL", // Todo lo demás
}
```

### El Molde Receptor (`CreateNotificacionDto`):

```typescript
export interface CreateNotificacionDto {
  usuario_id: string; // OBLIGATORIO: El usuario FINAL que DEBE recibir la alerta
  titulo: string; // OBLIGATORIO: Titulo resaltado "Factura Timbrada"
  mensaje: string; // OBLIGATORIO: Texto descriptivo "Su factura 01X fue aprobada"
  tipo: TipoNotificacion; // Enum de UI
  categoria?: CategoriaNotificacion; // Enum (Default: 'GENERAL')
  link_accion?: string; // Opcional: Ruta del Front-End (Ej. "/dashboard/facturas/12") para navegar al darle clic
}
```

---

## 3. Implementación Subyacente (El Orquestador Double-Duty)

Al inspeccionar el `notificacionesService.ts`, su método de creación no solo envía datos a Mongo, sino que coordina llamadas a servicios nativos de Cloud Messaging. Aunque todo sucede dentro de bloques try/catch segregados para **no arruinar** la inserción si el envío Push fallase (una falla de Firebase no debe borrar la base de datos).

```typescript
// Resumen arquitectonico de createNotificacion()

// 1. Inserción DB
const mongoResponse = await model.createNotificacionMongo(nuevaNotificacion);

// 2. Extracción de Llavero Push
const fcmToken = await getFcmTokenByUid(form.usuario_id);

// 3. Intento de Alerta Tiempo Real (Encapsulado en su propio Catch)
if (fcmToken) {
    try {
        await messaging.send({ token: fcmToken, data: { ... } });
    } catch (pushError) {
        // Absorbe el crasheo para continuar la función
        console.error("Error enviando push notification:", pushError);
    }
}

// 4. Inyección Transversal Clásica (Auditoría)
if (currentUser) {
    registrarLog({ ...descripcion: `Creación de notificación`, tipo_accion: "CREAR" });
}
```

---

## 4. ¿Cómo utilizar y disparar notificaciones desde otros módulos?

Cualquier módulo operativo u CRON Job profundo (`facturasService`, `archivosService`, `pagosService`) debe apoyarse de las notificaciones inmediatamente después de un impacto humano fuerte.

### Paso 1: Importar en tu Servicio Lógico

En la cabecera de tu nuevo controlador o servicio:

```typescript
import { createNotificacion } from "../notificaciones/notificacionesService";
import {
  TipoNotificacion,
  CategoriaNotificacion,
} from "../notificaciones/notificacionesDto";
```

### Paso 2: Invocar el Efecto Posterior (After-Effect)

Recuerda enviar el `req.user` (`currentUser`) como segundo parámetro si quieres que los Logs sepan **quién** causó la existencia de esa notificación.

**Ejemplo Teórico: Contribuyente aprueba autorización:**

```typescript
// En aprobacionesService.ts -> autorizarRecurso()

await model.aprobarMongo(id);

// Enviar notificación pasiva usando "await" o sin él si prefieres Fire-and-Forget
await createNotificacion(
  {
    usuario_id: recurso.creador_id, // Apuntamos al empleado que subió la revisión
    titulo: "¡Documento Aprobado!",
    mensaje: `Tu solicitud con folio ${id} ha sido aprobada exitosamente.`,
    tipo: TipoNotificacion.SUCCESS,
    categoria: CategoriaNotificacion.SISTEMA,
    link_accion: `/sistema/documentos/visor/${id}`, // Navegación Front-End
  },
  currentUser,
);

return true;
```

---

## 5. El Buzón Front-End (Puntos Críticos de Lectura)

Mientras que los módulos de `Logs` o `Metrics` son solo lectura macro, las notificaciones requieren mantenimiento microscópico por parte del usuario: Leer, MarcarLeida y Filtros.

La capa del Controlador de Notificaciones se encarga de acoplar rutas vitales de usabilidad en el cliente con su estructura única:

- **Contador Dinámico Visual (Meta.noLeidasCount):** Las consultas paginadas del DTO de MongoDB retornan velozmente la matriz `meta` en cada respuesta, sumando un `$count` exclusivo asíncrono sobre el estatus `leido: false`. Así tu componente gráfico sabe qué número rojo pintar dentro del ícono de la campanita.
- **Acciones Atómicas de Estado:** Contempla el método `marcarLeidaMongo(id)` para el click individual sobre el listado y `marcarTodasLeidasMongo(uid)` apoyado en el comando expansivo `updateMany` para el clásico botón de "Limpiar Bandeja" en la interfaz.

# Documentación Técnica: Ecosistema de Usuarios, Roles y Permisos

## Propósito

Este documento establece la arquitectura única, centralizada y agnóstica para todo manejo de usuarios con acceso al sistema en el Backend del Ecosistema. Aborda el modelo técnico real por el que los roles, la autenticación y la jerarquía de permisos interactúan, y provee una guía inmutable de implementación para cualquier nuevo módulo de usuarios a requerir, garantizando el respeto al estándar MVC-S de 6 archivos.

---

# Guía Técnica: Módulo Transversal de Correos Electrónicos (`Mail`)

El módulo de **Correos Electrónicos (`src/api/mail`)** opera como una **Utilería Transversal Clave** dentro de la arquitectura MVC-S. Aunque expone rutas y controladores propios para acciones externas (como formularios públicos de "Solicitud de Acceso"), su mayor valor radica en actuar como el despachador central de emails transaccionales para el resto de los servicios de la plataforma.

A continuación, se detalla su comportamiento, las tecnologías de plantillas que utiliza y la guía agnóstica para que cualquier otro recurso del sistema pueda disparar correos estructurados a los clientes.

---

## 1. Responsabilidad y Filosofía del Módulo

1. **Protocolo SMTP Centralizado:** Se encarga de instanciar y orquestar el `transporter` de `Nodemailer` conectado al relay de envío (Ej. Brevo SMTP). Esto unifica credenciales y evita que los servicios de negocio manejen configuraciones de red.
2. **Motor de Plantillas Dinámicas (EJS):** Separa estrictamente el "Diseño Visual" de la "Lógica de Envío". Utiliza Embedded JavaScript (`.ejs`) para renderizar variables del backend en hermosos correos en HTML puro.
3. **Módulo Doble-Propósito:** A diferencia de `Logs` o `Metrics`, este módulo tiene dos caras:
   - **Cara Interna (Side-Effect):** Exporta funciones para que servicios hermanos (Ej: _Usuarios_, _Cotizaciones_) invoquen silenciosamente el envío de un correo tras una mutación.
   - **Cara Externa (API Routes):** Posee su propio Controlador (`access.controller.ts`) para escuchar peticiones HTTP crudas, usualmente provenientes de Landing Pages o flujos no autenticados.
4. **Mutación Post-Envío (After-Effects):** En procesos de negocio críticos, el servicio de correo tiene la facultad de confirmar el envío hacia la base de datos origen. (Ej: Tras enviar exitosamente el correo, el `mailService` notifica a MongoDB que la Cotización debe pasar de estado "BORRADOR" a "ENVIADA").

---

## 2. El Ecosistema de Plantillas (Renderizado HTML)

Todo servicio de correo detesta el código HTML quemado (Hardcoded) dentro de TypeScript. Por ello, el directorio de este módulo aloja archivos `.ejs`.

Un archivo `ejs` es simplemente HTML que permite sintaxis inyectada.

**Ejemplo de una plantilla (ej. `newUserAdmin.ejs`):**

```html
<div class="caja-email">
  <h1>¡Hola administrador!</h1>
  <p>
    Se ha registrado un nuevo usuario con rol: <strong><%= user.role %></strong>
  </p>
  <p>Nombre: <%= user.name %></p>
  <footer>© <%= year %> Dapper Technologies</footer>
</div>
```

El servicio lee este archivo, inyecta el objeto JSON correspondiente y produce el string de HTML final que SMTP requiere.

---

## 3. Implementación Subyacente (El Orquestador de Nodemailer)

Al inspeccionar `mailService.ts`, el patrón de programación es declarativo y asíncrono. Todo envío debe estructurarse en 3 pasos:

```typescript
// Estructura agnóstica de una función de envío dentro de mailService.ts

export async function sendCorreoEjemplo(datosExternos: any, destinatario: string) {
    try {
        // 1. Crear el Transporte (Conexión SMTP)
        const transporter = nodemailer.createTransport({ host: "...", auth: { ... } });

        // 2. Renderizar la plantilla EJS a HTML String
        const htmlRenderizado = await ejs.renderFile(
            "src/api/mail/mi-plantilla.ejs",
            {
                user: datosExternos,
                year: new Date().getFullYear() // Variables al vuelo
            }
        );

        // 3. Empaquetar y Disparar el Envío
        await transporter.sendMail({
            from: '"Plataforma Web" <no-reply@dominio.com>',
            to: destinatario,
            subject: `Notificación para ${datosExternos.nombre}`,
            html: htmlRenderizado
        });

        return true;
    } catch (error) {
        // Absorción o Lanzamiento de Errores de Red
        console.error("Fallo al enviar correo:", error);
        throw error;
    }
}
```

---

## 4. ¿Cómo utilizar e invocar correos desde otros módulos?

Cualquier módulo operativo (`facturasService`, `usuariosService`) que requiera certificar un evento debe llamar a las funciones expuestas en el `mailService`.

### Paso 1: Configurar la Plantilla

Si es un correo completamente nuevo, crea un archivo `.ejs` en `src/api/mail/`. Define las variables que tu plantilla va a soportar (usando la sintaxis `<%= variable %>`).

### Paso 2: Crear la función despachadora en `mailService`

No escribas lógica de Nodemailer fuera de `mailService.ts`. Entra a este archivo y crea una exportación dedicada (ej. `sendFacturaCliente()`) siguiendo el patrón de 3 pasos mencionado arriba.

### Paso 3: Invocar como "Side-Effect" desde tu servicio origen

En la lógica de tu módulo destino (ej: Al timbrar/aprobar una factura), invocamos el correo asegurándonos de encapsularlo para no arruinar la transacción si el SMTP de Brevo cayera por timeout.

```typescript
// En facturasService.ts -> crearTimbrado()

const factura = await model.createFacturaMongo(payload);

// Invocación Transversal Segregada (No atamos el return principal a que el correo llege exitosamente)
import { sendFacturaCliente } from "../mail/mailService";

// Si se permite usar Fire-And-Forget (Sin await) o capturado en un Catch:
sendFacturaCliente(factura, clienteEmail).catch((err) => {
  // Si el correo rebota, no hacemos explotar el res.status(200) del Controlador.
  console.error("El proceso concluyó, pero el correo no salió.");
});

return factura._id;
```

---

## 5. El Rol del Controlador Propio (`access.controller`)

Como se mencionó al inicio, este módulo contiene su propia capa `Controller` y `Routes`. Esto es útil exclusivamente cuando el Frontend necesita consumir disparadores genéricos a los cuales no se les adjudica ninguna entidad compleja.

**Ejemplo:**

- Formulario de "Quiero ser cliente" en la puerta pública de la aplicación.
- Botones de "Reenviar Cotización" donde el payload viaja crudo en el `req.body` y el backend simplemente extrae `{ email, message }`, hace validaciones rudimentarias mediante _Regex_ e invoca al `sendQuotationEmail`.

**Normativa:** De preferencia, todo correo que surja como consecuencia lógica de Mutaciones (ej. Alguien fue borrado, creado o modificado) debe dispararse desde el Service Origen hacia el `mailService` (vía importación interna) y nunca forzar al Front-End a hacer un doble request HTTP apuntando al router de Mail.

# Arquitectura de Usuarios, Roles y Permisos

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

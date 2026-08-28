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
      fechaInicio: req.query.fechaInicio ? parseInt(req.query.fechaInicio as string) : undefined,
      fechaFin: req.query.fechaFin ? parseInt(req.query.fechaFin as string) : undefined,
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

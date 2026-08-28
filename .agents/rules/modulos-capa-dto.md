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

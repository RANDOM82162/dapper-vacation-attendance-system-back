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

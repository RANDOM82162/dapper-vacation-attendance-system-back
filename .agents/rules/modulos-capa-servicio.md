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

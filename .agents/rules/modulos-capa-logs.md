# Guía Técnica: Módulo Transversal de Logs (Auditoría e Historial)

En la arquitectura del ecosistema MVC-S, el módulo de **Logs** (`src/api/logs`) juega un rol excepcionalmente distinto al resto de los recursos. No es un módulo cuyo propósito principal sea mutado por los usuarios a través del cliente, sino que opera como un **Módulo Transversal (Cross-Cutting Concern)**.

Su responsabilidad es documentar, trazar y almacenar la vida de las operaciones críticas realizadas en la plataforma de manera agnóstica a qué entidad esté sufriendo dicho cambio. A continuación, se detalla su comportamiento, naturaleza asincrónica y cómo acoplarlo limpiamente a cualquier nuevo servicio de la aplicación.

---

## 1. Responsabilidad y Naturaleza del Módulo Logs

La diferencia arquitectónica de este módulo radica en su posición pasiva dentro del flujo de Controladores. Nadie lanza peticiones `POST /api/logs/create` de manera explícita en el _Frontend_. En su lugar, el módulo se engancha internamente al final de otras transacciones mediante programación orientada a "Efectos Secundarios" (_Side-Effects_).

Sus objetivos principales son:

1. **Auditoría Estricta:** Responder al _Quién_ (usuario_id, rol_usuario), _Qué_ (tipo_accion, descripcion), _Cuándo_ (fecha) y sobre _Quién_ (entidad_afectada, id_padre).
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

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

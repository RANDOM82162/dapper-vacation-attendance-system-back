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

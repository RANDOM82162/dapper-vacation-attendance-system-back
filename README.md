# Sistema de vacaciones y asistencia — backend

API Express y TypeScript para empleados, vacaciones, asistencia y notificaciones. Usa MongoDB para los registros y Firebase Authentication para identificar usuarios. El frontend está en el repositorio `dapper-vacation-attendance-system-front`.

## Requisitos

- Node.js 20 o superior y npm.
- MongoDB accesible desde el proceso.
- Proyecto Firebase con Authentication habilitado.
- Credenciales Firebase Admin en variables de entorno o Application Default Credentials.

## Configuración

1. Ejecuta `npm ci`.
2. Copia `.env.example` como `.env` y completa `CONNECTION_STRING`, `DB_NAME`, `FIREBASE_PROJECT_ID` y las credenciales Firebase Admin.
3. Ejecuta `npm run db:init` para crear colecciones, índices y la configuración inicial de asistencia.
4. Ejecuta `npm run dev` en desarrollo, o `npm run build` y `npm start` para usar el JavaScript compilado.

`npm test` recompila el backend y ejecuta pruebas locales del cálculo de vacaciones y de la omisión de semanas de asistencia ya importadas. No requiere una base de datos activa.

El puerto predeterminado de `npm start` es 3000; el ejemplo de `.env` usa 8080, que es el puerto esperado por el frontend local. `GET /api/ping` responde `ok` si el servidor y MongoDB están accesibles. La documentación OpenAPI se expone en `/api-docs`.

`.env` y los archivos de cuentas de servicio no deben enviarse con el código. `.env.example` solo contiene nombres y valores de muestra. El archivo `.env` estuvo versionado anteriormente; sacarlo del índice actual no elimina copias de la historia Git. Si allí hubo secretos reales, deben cambiarse antes de compartir el repositorio.

## Cuentas y recuperación

Un administrador crea empleados y cuentas Firebase mediante `POST /api/employees/create` o la pantalla `/admin/empleados`. No hay alta pública. Para preparar el primer administrador, ejecuta `npm run auth:create-admin -- --email CORREO --password CONTRASEÑA --name NOMBRE --employeeNumber NUMERO` con los valores reales del entorno. `--department` y `--hireDate` son opcionales.

El frontend usa Firebase Authentication para iniciar sesión y solicitar el correo de restablecimiento de contraseña. Firebase gestiona el código del enlace. La ruta de correo heredada que no estaba montada se retiró; `mailService` permanece porque envía avisos de vacaciones mediante Brevo cuando se configura.

## Módulos conectados

- `/api/employees`: perfiles y administración de empleados.
- `/api/vacation-requests`: solicitudes y decisiones.
- `/api/vacation-balances`: saldos y vencimientos.
- `/api/attendance-records`: registros, importaciones y reglas de asistencia.
- `/api/notificaciones`: notificaciones de usuario.
- `/api/admin`, `/api/metrics` y `/api/fcm`: módulos heredados que siguen montados o son usados por servicios transversales.

Las operaciones protegidas requieren `Authorization: Bearer <Firebase ID token>`. Los módulos de auditoría, notificaciones, métricas y correo tienen dependencias internas; no deben retirarse junto con las pantallas demo.

## Imagen Docker

El `Dockerfile` compila TypeScript y arranca `dist/index.js` con Node 20. Pasa las variables de entorno al contenedor en el despliegue; `.dockerignore` evita copiar `.env` y cuentas de servicio a la imagen. La cadena MongoDB debe ser accesible desde dentro del contenedor. `docker-compose.yml` conserva parámetros de desarrollo y no representa una configuración de producción del ERP.

## Comprobaciones antes de entregar

1. Ejecutar `npm run build` y `npm start` con una base de prueba.
2. Verificar `/api/ping`, `/api-docs` y autenticación Firebase.
3. Probar alta de empleado, vacaciones completas y actualización de saldos.
4. Importar el mismo Excel dos veces y confirmar que no duplica semanas ni registros.
5. Consultar asistencia y vacaciones con cada rol y comprobar las restricciones de acceso.

**Pendiente funcional fuera de esta limpieza:** confirmar el alcance de los jefes sobre solicitudes de otros equipos y quién puede administrar asistencia desde Dirección. No se modificaron esas reglas.

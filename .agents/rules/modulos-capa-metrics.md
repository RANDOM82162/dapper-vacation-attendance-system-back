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

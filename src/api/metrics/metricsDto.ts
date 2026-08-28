// Define qué métricas devolvemos al frontend
export interface MetricData {
    total: number;      // Valor actual
    variation: number;  // Porcentaje vs periodo anterior
    trend: 'up' | 'down' | 'neutral';
}

// La respuesta completa que consumirá tu gráfica y tarjetas
export interface AnalyticsResponse {
    period: string; // '2026', 'Marzo 2026', etc.
    kpis: {
        count: MetricData;  // Ej: Cantidad de Clientes
        amount: MetricData; // Ej: Saldo / Dinero
    };
    chart: {
        labels: string[];
        dataset: number[]; // Array para la gráfica (ChartJS/PrimeNG)
    };
}

// Filtros que pueden venir en el Query String
export interface AnalyticsQueryDto {
    context: string;   // 'CLIENTES', 'VENTAS', 'GASTOS'
    year?: number;
    month?: number;    // 1 - 12 (Opcional)
    week?: number;     // 1 - 52 (Opcional)
}

export interface MainDashboardCard {
    label: string;
    value: number;
    percentage: number;
    isPositive: boolean;
    isCurrency: boolean; // Para saber si pintar '$' en el front
}

export interface MainDashboardResponse {
    mode: 'week' | 'month';
    cards: MainDashboardCard[];
    chart: {
        labels: string[];
        series: { label: string; data: number[] }[];
    };
}

export interface SetBudgetDto {
    companyId: string;
    year: number;
    month: number; // 1-12
    amount: number;
}
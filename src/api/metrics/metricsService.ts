import { AnalyticsResponse, MainDashboardResponse } from "./metricsDto";
import { getAnalyticsByIdMongo, updateAnalyticsMetricMongo, Analytics, getAnalyticsByQueryMongo } from "./metricsModel";
import { AnalyticsUtils } from "./metricsUtils";
import { ROLES } from "../../middleware/auth.enum";

export class AnalyticsService {

    async trackTransaction(context: string, companyId: string, date: Date, amountChange: number, countChange: number) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1);
        const week = AnalyticsUtils.getWeekNumber(date);
        const day = AnalyticsUtils.getDayOfYear(date);
        
        const docId = `${context}_${companyId}_${year}`;

        const updateOperation = {
            $setOnInsert: {
                context: context,
                companyId: companyId,
                year: year,
                createdAt: new Date()
            },
            $set: { updatedAt: new Date() },
            $inc: {
                "global.count": countChange,
                "global.value": amountChange,
                [`monthly.${month}.count`]: countChange,
                [`monthly.${month}.value`]: amountChange,
                [`weekly.${week}.count`]: countChange,
                [`weekly.${week}.value`]: amountChange,
                [`daily.${day}.count`]: countChange,
                [`daily.${day}.value`]: amountChange
            }
        };
        console.log(updateOperation);
        await updateAnalyticsMetricMongo(docId, updateOperation);
        console.log("metrica registrada");
    }

    private async fetchAndAggregate(context: string, companyId: string | string[] | undefined, year: number, role?: string): Promise<Analytics | null> {
        let query: any = { context, year };

        if (companyId) {
            if (Array.isArray(companyId)) {
                // Si es un array de IDs (rol DESPACHO), usamos $in
                query.companyId = { $in: companyId };
            } else {
                // Si es un solo ID (rol CONTRIBUYENTE o AUXILIAR)
                query.companyId = companyId;
            }
        }
        // Si companyId es undefined (rol ADMIN), no se filtra por companyId y se obtienen todas.
        
        const docs = await getAnalyticsByQueryMongo(query);
        if (docs.length === 0) return null;
        
        const aggregated: Analytics = {
            _id: `AGGREGATED_${context}_${year}`,
            context,
            companyId: 'AGGREGATED', // Representa un agregado
            year,
            global: { count: 0, value: 0 },
            monthly: {},
            weekly: {},
            daily: {}
        };

        docs.forEach(doc => {
            aggregated.global.count += doc.global.count;
            aggregated.global.value += doc.global.value;

            for (const m in doc.monthly) {
                if (!aggregated.monthly[m]) aggregated.monthly[m] = { count: 0, value: 0 };
                aggregated.monthly[m].count += doc.monthly[m].count;
                aggregated.monthly[m].value += doc.monthly[m].value;
            }
            for (const w in doc.weekly) {
                if (!aggregated.weekly[w]) aggregated.weekly[w] = { count: 0, value: 0 };
                aggregated.weekly[w].count += doc.weekly[w].count;
                aggregated.weekly[w].value += doc.weekly[w].value;
            }
            for (const d in doc.daily) {
                if (!aggregated.daily[d]) aggregated.daily[d] = { count: 0, value: 0 };
                aggregated.daily[d].count += doc.daily[d].count;
                aggregated.daily[d].value += doc.daily[d].value;
            }
        });
        return aggregated;
    }

    async getStats(context: string, companyId: string | string[] | undefined, year: number, month?: number, week?: number, role?: string): Promise<AnalyticsResponse> {
        const hasValue = [
                "CLIENTES", "INGRESOS", "EGRESOS", "PRODUCTOS", "PRESUPUESTOS"
            ];
        
        const [currentDoc, prevYearDoc] = await Promise.all([
            this.fetchAndAggregate(context, companyId, year, role),
            this.fetchAndAggregate(context, companyId, year - 1, role)
        ]);

        let current = { count: 0, value: 0 };
        let prev = { count: 0, value: 0 };
        let chartData: number[] = [];
        let chartLabels: string[] = [];
        let periodLabel = `${year}`;

        if (week) {
            periodLabel = `Semana ${week} - ${year}`;
            const daysNumbers = AnalyticsUtils.getDaysInWeek(year, week);
            const currentWeekKey = String(week);
            const prevWeekKey = String(week - 1);

            current = currentDoc?.weekly?.[currentWeekKey] || { count: 0, value: 0 };
            prev = currentDoc?.weekly?.[prevWeekKey] || { count: 0, value: 0 };

            chartLabels = AnalyticsUtils.getWeekDayLabels();
            daysNumbers.forEach(dayNum => {
                if(hasValue.includes(context)){
                    chartData.push(currentDoc?.daily?.[String(dayNum)]?.value || 0);
                }else{
                    chartData.push(currentDoc?.daily?.[String(dayNum)]?.count || 0);
                }
            });
            console.log(chartData);
        }

        else if (month) {
            periodLabel = `Mes ${month}/${year}`;
            const currKey = String(month);
            const prevKey = month === 1 ? '12' : String(month - 1); 
            const sourceDocForPrev = month === 1 ? prevYearDoc : currentDoc;

            current = currentDoc?.monthly?.[currKey] || { count: 0, value: 0 };
            prev = sourceDocForPrev?.monthly?.[prevKey] || { count: 0, value: 0 };

            const weeksInMonth = AnalyticsUtils.getWeeksInMonth(year, month);
            
            chartLabels = weeksInMonth.map(w => `Sem ${w}`);
            weeksInMonth.forEach(w => {
                if(hasValue.includes(context)){
                    chartData.push(currentDoc?.weekly?.[String(w)]?.value || 0);
                }else{
                    chartData.push(currentDoc?.weekly?.[String(w)]?.count || 0);
                }
            });
            
        } 

        else {
            current = currentDoc?.global || { count: 0, value: 0 };
            prev = prevYearDoc?.global || { count: 0, value: 0 };

            chartLabels = AnalyticsUtils.getMonthLabels();
            for (let i = 1; i <= 12; i++) {
                if(hasValue.includes(context)){
                    chartData.push(currentDoc?.monthly?.[String(i)]?.value || 0);
                }else{
                    chartData.push(currentDoc?.monthly?.[String(i)]?.count || 0);
                }
            }
        }

        const varCount = AnalyticsUtils.calculateVariation(current.count, prev.count);
        const varValue = AnalyticsUtils.calculateVariation(current.value, prev.value);

        return {
            period: periodLabel,
            kpis: {
                count: { total: current.count, variation: varCount, trend: AnalyticsUtils.getTrend(varCount) },
                amount: { total: current.value, variation: varValue, trend: AnalyticsUtils.getTrend(varValue) }
            },
            chart: {
                labels: chartLabels,
                dataset: chartData
            }
        };
    }

    async getMainDashboardStats(companyId: string | string[] | undefined, viewMode: 'week' | 'month', role?: string): Promise<MainDashboardResponse> {
        const today = new Date();
        const year = today.getFullYear();
        
        const [
            ingresosDoc,
            egresosDoc,
            facturasDoc,
            cotizacionesDoc,
            tareasDoc,
            productosDoc,
            clientesDoc,
            proveedoresDoc,
            catalogosDoc,
            presupuestosDoc
        ] = await Promise.all([
            this.fetchAndAggregate('INGRESOS', companyId, year, role),
            this.fetchAndAggregate('EGRESOS', companyId, year, role),
            this.fetchAndAggregate('FACTURAS', companyId, year, role),
            this.fetchAndAggregate('COTIZACIONES', companyId, year, role),
            this.fetchAndAggregate('TAREAS', companyId, year, role),
            this.fetchAndAggregate('PRODUCTOS', companyId, year, role),
            this.fetchAndAggregate('CLIENTES', companyId, year, role),
            this.fetchAndAggregate('PROVEEDORES', companyId, year, role),
            this.fetchAndAggregate('CATALOGOS', companyId, year, role),
            this.fetchAndAggregate('PRESUPUESTOS', companyId, year, role)
        ]);

        let chartLabels: string[] = [];
        let ingresosData: number[] = [];
        let egresosData: number[] = [];
        
        let currentKpiKey: string;
        let prevKpiKey: string;
        let bucketType: 'weekly' | 'monthly';

        if (viewMode === 'week') {
            const weekNum = parseInt(AnalyticsUtils.getWeekNumber(today));
            currentKpiKey = String(weekNum);
            prevKpiKey = String(weekNum - 1);
            bucketType = 'weekly';

            chartLabels = AnalyticsUtils.getWeekDayLabels();
            const daysInWeek = AnalyticsUtils.getDaysInWeek(year, weekNum);
            
            daysInWeek.forEach(day => {
                ingresosData.push(ingresosDoc?.daily?.[String(day)]?.value || 0);
                egresosData.push(egresosDoc?.daily?.[String(day)]?.value || 0);
            });

        } else {
            const monthNum = today.getMonth() + 1
            currentKpiKey = String(monthNum);
            prevKpiKey = String(monthNum - 1);
            bucketType = 'monthly';

            const weeksInMonth = AnalyticsUtils.getWeeksInMonth(year, monthNum);
            chartLabels = weeksInMonth.map(w => `Sem ${w}`);
            
            weeksInMonth.forEach(w => {
                ingresosData.push(ingresosDoc?.weekly?.[String(w)]?.value || 0);
                egresosData.push(egresosDoc?.weekly?.[String(w)]?.value || 0);
            });
        }

        const getCardData = (doc: Analytics | null, label: string, isCurrency: boolean) => {
            
            let currVal = 0;
            let prevVal = 0;

            if (isCurrency) {
                 currVal = doc?.[bucketType]?.[currentKpiKey]?.value || 0;
                 prevVal = doc?.[bucketType]?.[prevKpiKey]?.value || 0;
            } else {
                 currVal = doc?.[bucketType]?.[currentKpiKey]?.count || 0;
                 prevVal = doc?.[bucketType]?.[prevKpiKey]?.count || 0;
            }

            const variation = AnalyticsUtils.calculateVariation(currVal, prevVal);
            
            return {
                label,
                value: currVal,
                percentage: variation,
                isPositive: variation >= 0,
                isCurrency
            };
        };

        return {
            mode: viewMode,
            cards: [
                getCardData(ingresosDoc, 'Ingresos', true),
                getCardData(egresosDoc, 'Egresos', true),
                getCardData(presupuestosDoc, 'Presupuestos', true),
                getCardData(cotizacionesDoc, 'Cotizaciones', false),
                getCardData(facturasDoc, 'Facturas (Monto)', false),
                
                getCardData(clientesDoc, 'Clientes Nuevos', false),
                getCardData(tareasDoc, 'Tareas Creadas', false),
                getCardData(productosDoc, 'Productos', false),
                getCardData(proveedoresDoc, 'Proveedores', false),
                getCardData(catalogosDoc, 'Catálogos', false)
            ],
            chart: {
                labels: chartLabels,
                series: [
                    { label: 'Ingresos', data: ingresosData },
                    { label: 'Egresos', data: egresosData }
                ]
            }
        };
    }

    async setBudget(companyId: string, year: number, month: number, amount: number) {
        const docId = `PRESUPUESTOS_${companyId}_${year}`;
        
        // 1. Obtener el valor actual para calcular la diferencia
        const currentDoc = await getAnalyticsByIdMongo(docId);
        const currentMonthValue = currentDoc?.monthly?.[String(month)]?.value || 0;
        const diff = amount - currentMonthValue;

        if (diff === 0) return; // No hay cambios

        // 2. Calcular distribución diaria
        const daysInMonth = new Date(year, month, 0).getDate();
        const dailyDiff = diff / daysInMonth;

        const incUpdate: any = {
            "global.value": diff,
            [`monthly.${month}.value`]: diff
        };

        for (let d = 1; d <= daysInMonth; d++) {
            const date = new Date(year, month - 1, d);
            const dayOfYear = AnalyticsUtils.getDayOfYear(date);
            const week = AnalyticsUtils.getWeekNumber(date);
            
            const dailyKey = `daily.${dayOfYear}.value`;
            incUpdate[dailyKey] = (incUpdate[dailyKey] || 0) + dailyDiff;
            
            const weeklyKey = `weekly.${week}.value`;
            incUpdate[weeklyKey] = (incUpdate[weeklyKey] || 0) + dailyDiff;
        }

        const updateOperation = {
            $setOnInsert: { context: 'PRESUPUESTOS', companyId, year, createdAt: new Date() },
            $set: { updatedAt: new Date() },
            $inc: incUpdate
        };

        await updateAnalyticsMetricMongo(docId, updateOperation);
    }
}

export const analyticsInstance = new AnalyticsService();

export function registrarMetrica(context: string, companyId: string, amount: number = 0, count: number = 1) {
    analyticsInstance.trackTransaction(context, companyId, new Date(), amount, count)
        .catch(error => console.error(`Error registrando métrica ${context}:`, error));
}
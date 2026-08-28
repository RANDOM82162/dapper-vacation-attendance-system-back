import moment from 'moment';

export const AnalyticsUtils = {
    calculateVariation(current: number, previous: number): number {
        if (previous === 0) return current > 0 ? 100 : 0;
        const variation = ((current - previous) / previous) * 100;
        return parseFloat(variation.toFixed(1));
    },

    getTrend(variation: number): 'up' | 'down' | 'neutral' {
        if (variation > 0) return 'up';
        if (variation < 0) return 'down';
        return 'neutral';
    },

    getWeekNumber(date: Date): string {
        return String(moment(date).isoWeek());
    },

    getDayOfYear(date: Date): string {
        return String(moment(date).dayOfYear());
    },

    getMonthLabels(): string[] {
        return ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    },

    getWeeksInMonth(year: number, month: number): number[] {
        const startOfMonth = moment([year, month - 1]);
        const endOfMonth = moment(startOfMonth).endOf('month');
        
        const weeks = [];
        let currentWeek = startOfMonth.isoWeek();
        const lastWeek = endOfMonth.isoWeek();

        if (lastWeek < currentWeek) {
            for (let i = currentWeek; i <= 52; i++) weeks.push(i);
        } else {
            for (let i = currentWeek; i <= lastWeek; i++) {
                weeks.push(i);
            }
        }
        return weeks;
    },

    getDaysInWeek(year: number, week: number): number[] {
        const startOfWeek = moment().year(year).isoWeek(week).startOf('isoWeek');
        
        const days = [];
        for (let i = 0; i < 7; i++) {
            days.push(moment(startOfWeek).add(i, 'days').dayOfYear());
        }
        return days;
    },

    getWeekDayLabels(): string[] {
        return ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    }
};
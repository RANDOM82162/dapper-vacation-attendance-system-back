export interface VacationPeriodByMexicanLaw {
  year: number;
  serviceYears: number;
  legalDays: number;
  periodStartDate: string;
  periodEndDate: string;
}

export function getMexicanVacationDaysBySeniority(serviceYears: number) {
  if (serviceYears < 1) return 0;
  if (serviceYears <= 5) return 10 + serviceYears * 2;

  return 20 + Math.ceil((serviceYears - 5) / 5) * 2;
}

export function getVacationPeriodForDate(hireDate: string, referenceDate = new Date()): VacationPeriodByMexicanLaw | null {
  const hire = parseLocalDate(hireDate);
  const reference = clearTime(referenceDate);

  if (!hire || reference < hire) return null;

  const anniversaryThisYear = new Date(reference.getFullYear(), hire.getMonth(), hire.getDate());
  const periodStartYear = reference >= anniversaryThisYear ? reference.getFullYear() : reference.getFullYear() - 1;
  const serviceYears = periodStartYear - hire.getFullYear();

  if (serviceYears < 1) return null;

  const periodStart = new Date(periodStartYear, hire.getMonth(), hire.getDate());
  const periodEnd = new Date(periodStartYear + 1, hire.getMonth(), hire.getDate() - 1);

  return {
    year: periodStartYear,
    serviceYears,
    legalDays: getMexicanVacationDaysBySeniority(serviceYears),
    periodStartDate: formatIsoDate(periodStart),
    periodEndDate: formatIsoDate(periodEnd),
  };
}

function parseLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) return null;

  return clearTime(new Date(year, month - 1, day));
}

function clearTime(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

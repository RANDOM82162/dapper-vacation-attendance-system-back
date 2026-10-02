const cron: {
  schedule: (expression: string, task: () => void, options: { timezone: string }) => unknown;
} = require("node-cron");
import { EmployeeRole, EmployeeStatus } from "../employees/employeesDto";
import * as employeesModel from "../employees/employeesModel";
import { createNotificacionParaUsuariosUnaVez } from "../notificaciones/notificacionesService";
import { CategoriaNotificacion, TipoNotificacion } from "../notificaciones/notificacionesDto";
import * as notificationsModel from "../notificaciones/notificacionesModel";
import * as balancesModel from "./vacationBalancesModel";
import { syncEmployeeVacationBalanceWithMexicanLaw } from "./vacationBalancesService";
import { getVacationPeriodForDate } from "../../shared/utils/mexicanVacationPolicy";

const TIME_ZONE = "America/Cancun";
const RECIPIENT_ROLES = [EmployeeRole.ADMINISTRADOR, EmployeeRole.JEFE_DIRECTOR];

type ReminderStage = {
  key: "2-months" | "1-month" | "15-days";
  startDate: string;
  endDate: string;
  label: string;
};

let scheduleStarted = false;
let reminderIndexReady = false;

export function startVacationBalanceReminderSchedule() {
  if (scheduleStarted) return;
  scheduleStarted = true;

  cron.schedule("0 9 * * *", () => {
    runVacationBalanceReminders().catch((error) => {
      console.error("No se pudieron procesar los recordatorios de vacaciones:", error);
    });
  }, { timezone: TIME_ZONE });

  runVacationBalanceReminders().catch((error) => {
    console.error("No se pudieron procesar los recordatorios iniciales de vacaciones:", error);
  });
}

export async function runVacationBalanceReminders(referenceDate = getTodayInCancun()) {
  if (!reminderIndexReady) {
    await notificationsModel.ensureReminderNotificationIndex();
    reminderIndexReady = true;
  }

  parseDate(referenceDate);
  const today = referenceDate;
  const employees = await employeesModel.getAllEmployeesMongo({
    status: EmployeeStatus.ACTIVO,
    page: 1,
    limit: 5000,
  });
  const recipientUserIds = employees.data
    .filter((employee) => RECIPIENT_ROLES.includes(employee.role) && employee.uid)
    .map((employee) => employee.uid as string);

  for (const employee of employees.data) {
    if (!employee.hireDate) continue;

    try {
      const period = getVacationPeriodForDate(employee.hireDate, toLocalDate(referenceDate));
      if (!period) continue;

      await syncEmployeeVacationBalanceWithMexicanLaw(employee, undefined, toLocalDate(referenceDate));
      const expiryDate = addDays(period.periodEndDate, 1);
      const stage = getReminderStage(today, expiryDate);
      if (!stage) continue;

      const balance = await balancesModel.getVacationBalanceForEmployee(
        employee._id.toString(),
        employee.name,
        period.year,
      );
      if (!balance || balance.availableDays <= 0) continue;

      const dayLabel = balance.availableDays === 1 ? "día" : "días";
      const expiryLabel = formatDate(expiryDate);
      const message = `${employee.name} tiene ${balance.availableDays} ${dayLabel} de vacaciones disponibles que vencen el ${expiryLabel}. El saldo no se acumula al iniciar el siguiente ciclo.`;

      await createNotificacionParaUsuariosUnaVez(
        recipientUserIds,
        {
          titulo: "Saldo de vacaciones por vencer",
          mensaje: `${message} Recordatorio: ${stage.label}.`,
          tipo: TipoNotificacion.INFO,
          categoria: CategoriaNotificacion.SISTEMA,
          link_accion: "/vacaciones/saldos",
        },
        `vacation-expiry:${employee._id.toString()}:${period.year}:${stage.key}`,
      );
    } catch (error) {
      console.error(`No se pudo revisar el saldo de vacaciones de ${employee.name}:`, error);
    }
  }
}

function getReminderStage(today: string, expiryDate: string): ReminderStage | null {
  const twoMonthsBefore = subtractMonths(expiryDate, 2);
  const oneMonthBefore = subtractMonths(expiryDate, 1);
  const fifteenDaysBefore = addDays(expiryDate, -15);
  const stages: ReminderStage[] = [
    { key: "2-months", startDate: twoMonthsBefore, endDate: oneMonthBefore, label: "faltan aproximadamente 2 meses" },
    { key: "1-month", startDate: oneMonthBefore, endDate: fifteenDaysBefore, label: "falta aproximadamente 1 mes" },
    { key: "15-days", startDate: fifteenDaysBefore, endDate: expiryDate, label: "faltan 15 días o menos" },
  ];

  return stages.find((stage) => today >= stage.startDate && today < stage.endDate) || null;
}

function getTodayInCancun() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: string) => parts.find((value) => value.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function toLocalDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12);
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) throw new Error("Fecha de referencia invalida para recordatorios de vacaciones");
  return Date.UTC(year, month - 1, day);
}

function addDays(value: string, amount: number) {
  const date = new Date(parseDate(value));
  date.setUTCDate(date.getUTCDate() + amount);
  return formatIsoDate(date);
}

function subtractMonths(value: string, amount: number) {
  const date = new Date(parseDate(value));
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() - amount);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return formatIsoDate(date);
}

function formatIsoDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "UTC",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

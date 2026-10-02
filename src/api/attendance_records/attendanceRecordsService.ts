import { ObjectId } from "mongodb";
import { BaseError } from "../../shared/classes/base-error";
import { HttpStatusCode } from "../../shared/models/http.model";
import { registrarLog } from "../logs/logsService";
import { createNotificacionParaEmpleadosActivos, createNotificacionParaRoles } from "../notificaciones/notificacionesService";
import { CategoriaNotificacion, TipoNotificacion } from "../notificaciones/notificacionesDto";
import { EmployeeRole } from "../employees/employeesDto";
import { getMexicoFederalHolidayDates } from "../../shared/utils/vacationDays";
import { getApprovedVacationRequestsOverlappingRange } from "../vacation_requests/vacationRequestsModel";
import { VacationRequestBase } from "../vacation_requests/vacationRequestsDto";
import {
  AttendanceImportBase,
  AttendanceRecordBase,
  AttendanceDayField,
  DeleteAttendanceImportResult,
  GetAllAttendanceImportsFilters,
  GetAllAttendanceRecordsFilters,
  ImportAttendanceRecordsDto,
  ImportAttendanceRecordsResult,
  ImportAttendanceWeekDto,
  UpdateAttendanceSettingsDto,
  UpdateAttendanceForgivenessDto,
  UpdateAttendancePermissionDto,
} from "./attendanceRecordsDto";
import * as model from "./attendanceRecordsModel";

export async function getAttendanceSettings() {
  try {
    return await model.getAttendanceSettingsMongo();
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAttendanceSettings");
  }
}

export async function updateAttendanceSettings(form: UpdateAttendanceSettingsDto, currentUser: any) {
  try {
    const updateData = validateAttendanceSettings(form);
    const settings = await model.updateAttendanceSettingsMongo(updateData);

    registrarLog({
      usuario_id: currentUser?.uid || "SYSTEM",
      rol_usuario: currentUser?.role || "SYSTEM",
      descripcion: "Actualización de configuración de asistencia",
      tipo_accion: "ESCRITURA",
      entidad_afectada: "CONFIGURACION_ASISTENCIA",
    }).catch(() => {});

    return settings;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "updateAttendanceSettings");
  }
}

export async function getAttendanceRecords(filters: GetAllAttendanceRecordsFilters) {
  try {
    return await model.getAllAttendanceRecordsMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAttendanceRecords");
  }
}

export async function getAttendanceImports(filters: GetAllAttendanceImportsFilters) {
  try {
    return await model.getAllAttendanceImportsMongo(filters);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAttendanceImports");
  }
}

export async function importAttendanceRecords(form: ImportAttendanceRecordsDto, currentUser: any) {
  try {
    if (!form.weeks || !Array.isArray(form.weeks) || form.weeks.length === 0) {
      throw new BaseError(
        "Missing weeks",
        "No hay semanas de asistencia para guardar",
        "importAttendanceRecords",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const result: ImportAttendanceRecordsResult = {
      insertedWeeks: [],
      skippedWeeks: [],
      insertedRecords: 0,
      skippedRecords: 0,
    };
    const importId = new ObjectId();
    const uploadedAt = new Date();
    const weekKeys: string[] = [];
    const importWeeks: AttendanceImportBase["weeks"] = [];

    for (const week of form.weeks) {
      validateWeek(week);

      if (!isReportWeek(week.weekStartDate, week.weekEndDate)) {
        continue;
      }

      const weekKey = getWeekKey(week);
      weekKeys.push(weekKey);
      const existingRecords = await model.countAttendanceRecordsByWeek(weekKey, week.weekStartDate);

      if (existingRecords > 0) {
        result.skippedWeeks.push(weekKey);
        result.skippedRecords += week.rows.length;
        importWeeks.push(buildImportWeekSummary(week, weekKey, "OMITIDA"));
        continue;
      }

      const approvedVacations = await getApprovedVacationRequestsOverlappingRange(week.weekStartDate, week.weekEndDate);
      const records = buildAttendanceRecords(week, weekKey, importId.toString(), form.sourceFileName, approvedVacations);

      if (records.length === 0) {
        result.skippedWeeks.push(weekKey);
        importWeeks.push(buildImportWeekSummary(week, weekKey, "OMITIDA"));
        continue;
      }

      const mongoResponse = await model.insertAttendanceRecordsMongo(records);
      result.insertedWeeks.push(weekKey);
      result.insertedRecords += mongoResponse.insertedCount || records.length;
      importWeeks.push(buildImportWeekSummary(week, weekKey, "GUARDADA"));
    }

    const attendanceImport: AttendanceImportBase = {
      _id: importId,
      sourceFileName: form.sourceFileName,
      uploadedAtTS: uploadedAt.getTime(),
      uploadedAtISO: uploadedAt.toISOString(),
      weekKeys,
      weeks: importWeeks,
      insertedWeeks: result.insertedWeeks,
      skippedWeeks: result.skippedWeeks,
      insertedRecords: result.insertedRecords,
      skippedRecords: result.skippedRecords,
      uploadedBy: currentUser?.uid || "SYSTEM",
      creationDateTS: uploadedAt.getTime(),
    };

    await model.createAttendanceImportMongo(attendanceImport);

    if (result.insertedRecords > 0) {
      createNotificacionParaEmpleadosActivos(
        {
          titulo: "Reporte semanal de asistencia disponible",
          mensaje: `Se cargaron ${result.insertedWeeks.length} semana(s) de asistencia desde ${form.sourceFileName || "el Excel de huella"}.`,
          tipo: TipoNotificacion.INFO,
          categoria: CategoriaNotificacion.SISTEMA,
          link_accion: "/asistencia/reporte",
        },
        currentUser,
      ).catch(() => {});

      createNotificacionParaRoles(
        [EmployeeRole.JEFE_DIRECTOR, EmployeeRole.ADMINISTRADOR],
        {
          titulo: "Reporte semanal de asistencia cargado",
          mensaje: `Ya puedes revisar ${result.insertedWeeks.length} semana(s) y ${result.insertedRecords} registro(s) de asistencia.`,
          tipo: TipoNotificacion.SUCCESS,
          categoria: CategoriaNotificacion.SISTEMA,
          link_accion: "/asistencia/dashboard",
        },
        currentUser,
      ).catch(() => {});

      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Importacion de asistencia: ${result.insertedWeeks.length} semana(s), ${result.insertedRecords} registro(s)`,
        tipo_accion: "CREAR",
        entidad_afectada: "ASISTENCIA",
      }).catch(() => {});
    }

    return result;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "importAttendanceRecords");
  }
}

export async function deleteAttendanceImport(id: string, currentUser: any): Promise<DeleteAttendanceImportResult> {
  try {
    const attendanceImport = await model.getAttendanceImportById(id);

    if (!attendanceImport) {
      throw new BaseError(
        "Not found",
        "Carga de asistencia no encontrada",
        "deleteAttendanceImport",
        HttpStatusCode.NOT_FOUND,
      );
    }

    const weekKeysToDelete = getInsertedWeekKeys(attendanceImport);
    const deletedRecords = await model.deleteAttendanceRecordsByImport(id, weekKeysToDelete);
    const deletedImport = await model.deleteAttendanceImportMongo(id);
    const deletedRecordsCount = Number(deletedRecords.deletedCount || 0);
    const deletedImportCount = Number(deletedImport.deletedCount || 0);

    if (deletedImportCount > 0) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `Eliminacion de carga de asistencia: ${attendanceImport.sourceFileName || id}`,
        tipo_accion: "BORRADO",
        entidad_afectada: "ASISTENCIA",
      }).catch(() => {});
    }

    return {
      deletedImport: deletedImportCount > 0,
      deletedRecords: deletedRecordsCount,
    };
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "deleteAttendanceImport");
  }
}

export async function updateAttendancePermission(id: string, form: UpdateAttendancePermissionDto, currentUser: any) {
  try {
    if (!isAttendanceDayField(form.field)) {
      throw new BaseError(
        "Invalid field",
        "El campo de asistencia no es valido",
        "updateAttendancePermission",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const updatedRecord = await model.updateAttendanceRecordPermissionMongo(id, form);

    if (updatedRecord) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: `${form.hasPermission ? "Marcacion" : "Retiro"} de permiso en asistencia`,
        tipo_accion: "ESCRITURA",
        entidad_afectada: "ASISTENCIA",
      }).catch(() => {});
    }

    return updatedRecord;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "updateAttendancePermission");
  }
}

export async function updateAttendanceForgiveness(id: string, form: UpdateAttendanceForgivenessDto, currentUser: any) {
  try {
    const hasForgivenessOption =
      "forgiveLateCount" in form ||
      "forgiveAccumulatedLateCount" in form ||
      "forgiveAccumulatedSaturdayCount" in form;

    if (!hasForgivenessOption) {
      throw new BaseError(
        "Missing forgiveness options",
        "Selecciona al menos un concepto para actualizar",
        "updateAttendanceForgiveness",
        HttpStatusCode.BAD_REQUEST,
      );
    }

    const updatedRecord = await model.updateAttendanceRecordForgivenessMongo(id, form);

    if (updatedRecord) {
      registrarLog({
        usuario_id: currentUser?.uid || "SYSTEM",
        rol_usuario: currentUser?.role || "SYSTEM",
        descripcion: "Perdon de observaciones de asistencia",
        tipo_accion: "ESCRITURA",
        entidad_afectada: "ASISTENCIA",
      }).catch(() => {});
    }

    return updatedRecord;
  } catch (error) {
    if (error instanceof BaseError) throw error;
    throw new BaseError("Inside catch: ", error, "updateAttendanceForgiveness");
  }
}

function validateWeek(week: ImportAttendanceWeekDto) {
  if (!week.weekStartDate || !week.weekEndDate || !Array.isArray(week.rows)) {
    throw new BaseError(
      "Invalid week",
      "Cada semana debe tener fecha inicial, fecha final y registros",
      "validateWeek",
      HttpStatusCode.BAD_REQUEST,
    );
  }
}

function isReportWeek(weekStartDate: string, weekEndDate: string) {
  const cursor = new Date(`${weekStartDate}T00:00:00`);
  const end = new Date(`${weekEndDate}T00:00:00`);

  while (cursor <= end) {
    const day = cursor.getDay();
    if (day >= 1 && day <= 5) return true;
    cursor.setDate(cursor.getDate() + 1);
  }

  return false;
}

function buildAttendanceRecords(
  week: ImportAttendanceWeekDto,
  weekKey: string,
  importId: string,
  sourceFileName?: string,
  approvedVacations: VacationRequestBase[] = [],
) {
  const now = new Date().getTime();

  return week.rows
    .filter((row) => row.employeeName && row.department)
    .map<AttendanceRecordBase>((row) => {
      const record: AttendanceRecordBase = {
        _id: new ObjectId(),
        importId,
        weekKey,
        weekLabel: week.weekLabel,
        weekStartDate: week.weekStartDate,
        weekEndDate: week.weekEndDate,
        date: week.weekStartDate,
        employeeId: row.employeeId || row.employeeName,
        employeeName: row.employeeName,
        department: row.department,
        monday: row.monday,
        tuesday: row.tuesday,
        wednesday: row.wednesday,
        thursday: row.thursday,
        friday: row.friday,
        saturday: row.saturday,
        saturdayDueDate: row.saturdayDueDate,
        saturdayStatus: row.saturdayStatus,
        observations: row.observations,
        lateCount: row.lateCount,
        permissionLateCount: row.permissionLateCount,
        accumulatedLateCount: row.accumulatedLateCount,
        accumulatedSaturdayCount: row.accumulatedSaturdayCount,
        permissionOriginalValues: row.permissionOriginalValues,
        forgivenLateCount: row.forgivenLateCount,
        forgivenAccumulatedLateCount: row.forgivenAccumulatedLateCount,
        forgivenAccumulatedSaturdayCount: row.forgivenAccumulatedSaturdayCount,
        forgivenOriginalAccumulatedLateCount: row.forgivenOriginalAccumulatedLateCount,
        forgivenOriginalAccumulatedSaturdayCount: row.forgivenOriginalAccumulatedSaturdayCount,
        forgivenOriginalSaturday: row.forgivenOriginalSaturday,
        forgivenOriginalSaturdayDueDate: row.forgivenOriginalSaturdayDueDate,
        forgivenOriginalSaturdayStatus: row.forgivenOriginalSaturdayStatus,
        sourceFileName,
        creationDateTS: now,
      };

      return applyApprovedVacationsToRecord(record, approvedVacations);
    });
}

function applyApprovedVacationsToRecord(record: AttendanceRecordBase, approvedVacations: VacationRequestBase[]) {
  const weekDates = getDatesInRange(record.weekStartDate, record.weekEndDate);
  const vacationsForEmployee = approvedVacations.filter((vacation) => isSameEmployee(record, vacation));

  if (vacationsForEmployee.length === 0) return record;

  weekDates.forEach((date) => {
    const field = getAttendanceDayFieldForDate(date);
    if (!field || date.getDay() === 6 || isFederalHoliday(date)) return;

    const dateKey = formatDateKey(date);
    const isVacationDate = vacationsForEmployee.some((vacation) => vacation.startDate <= dateKey && vacation.endDate >= dateKey);
    if (!isVacationDate) return;

    record[field] = "Vacaciones";
  });

  const summary = buildAttendanceSummary(record);
  record.observations = summary.observations;
  record.lateCount = summary.lateCount;
  record.permissionLateCount = summary.permissionLateCount;
  record.accumulatedLateCount = summary.accumulatedLateCount;
  record.accumulatedSaturdayCount = summary.accumulatedSaturdayCount;

  return record;
}

function buildAttendanceSummary(record: AttendanceRecordBase) {
  const lateCount = getWorkdayValues(record).filter((value) => isLateAttendanceValue(value)).length;
  const missingCount = getWorkdayValues(record).filter((value) => value === "Falta").length;
  const permissionLateCount = getAttendanceValues(record).filter((value) => value === "Permiso").length;
  const accumulatedLateCount = record.forgivenAccumulatedLateCount ? 0 : record.accumulatedLateCount || 0;
  const accumulatedSaturdayCount = record.forgivenAccumulatedSaturdayCount ? 0 : record.accumulatedSaturdayCount || 0;

  return {
    observations: buildAttendanceObservations(
      record.forgivenLateCount ? 0 : lateCount,
      accumulatedSaturdayCount,
      accumulatedLateCount,
      missingCount,
      permissionLateCount,
    ),
    lateCount: record.forgivenLateCount ? 0 : lateCount,
    permissionLateCount,
    accumulatedLateCount,
    accumulatedSaturdayCount,
  };
}

function buildAttendanceObservations(
  lateCount: number,
  saturdayDebtCount: number,
  accumulatedLateCount: number,
  missingCount: number,
  permissionLateCount: number,
) {
  const parts: string[] = [];

  if (missingCount > 0) {
    parts.push(`${missingCount} falta${missingCount === 1 ? "" : "s"}`);
  }

  if (lateCount > 0) {
    parts.push(`${lateCount} retardo${lateCount === 1 ? "" : "s"} semana`);
  }

  if (saturdayDebtCount > 0) {
    parts.push(`Debe ${saturdayDebtCount} sabado${saturdayDebtCount === 1 ? "" : "s"}`);
  }

  if (accumulatedLateCount > 0) {
    parts.push(`${accumulatedLateCount} dia${accumulatedLateCount === 1 ? "" : "s"} acumulado${accumulatedLateCount === 1 ? "" : "s"}`);
  }

  if (permissionLateCount > 0) {
    parts.push(`${permissionLateCount} permiso${permissionLateCount === 1 ? "" : "s"}`);
  }

  return parts.length > 0 ? parts.join(" | ") : "Correcto";
}

function getWorkdayValues(record: AttendanceRecordBase) {
  return [record.monday, record.tuesday, record.wednesday, record.thursday, record.friday];
}

function getAttendanceValues(record: AttendanceRecordBase) {
  return [...getWorkdayValues(record), record.saturday];
}

function isLateAttendanceValue(value?: string) {
  const firstPunch = String(value || "").match(/\d{1,2}:\d{2}/)?.[0];
  if (!firstPunch) return false;

  const [hours, minutes] = firstPunch.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return false;

  return hours * 60 + minutes > 9 * 60 + 5;
}

function getAttendanceDayFieldForDate(date: Date): AttendanceDayField | null {
  const fieldsByDay: Record<number, AttendanceDayField> = {
    1: "monday",
    2: "tuesday",
    3: "wednesday",
    4: "thursday",
    5: "friday",
    6: "saturday",
  };

  return fieldsByDay[date.getDay()] || null;
}

function isSameEmployee(record: AttendanceRecordBase, vacation: VacationRequestBase) {
  const recordEmployeeId = normalizeText(record.employeeId || "");
  const vacationEmployeeId = normalizeText(vacation.employeeId || "");

  if (recordEmployeeId && vacationEmployeeId && recordEmployeeId === vacationEmployeeId) return true;

  return normalizeText(record.employeeName) === normalizeText(vacation.employeeName);
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function validateAttendanceSettings(form: UpdateAttendanceSettingsDto): UpdateAttendanceSettingsDto {
  const updateData: UpdateAttendanceSettingsDto = {};

  if (form.workdayStartTime !== undefined) {
    const workdayStartTime = String(form.workdayStartTime).trim();
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(workdayStartTime)) {
      throw new BaseError("Invalid time", "La hora de entrada debe tener formato HH:mm", "validateAttendanceSettings", HttpStatusCode.BAD_REQUEST);
    }
    updateData.workdayStartTime = workdayStartTime;
  }

  if (form.lateToleranceMinutes !== undefined) {
    const lateToleranceMinutes = Number(form.lateToleranceMinutes);
    if (!Number.isFinite(lateToleranceMinutes) || lateToleranceMinutes < 0 || lateToleranceMinutes > 59) {
      throw new BaseError("Invalid tolerance", "La tolerancia debe estar entre 0 y 59 minutos", "validateAttendanceSettings", HttpStatusCode.BAD_REQUEST);
    }
    updateData.lateToleranceMinutes = Math.trunc(lateToleranceMinutes);
  }

  if (form.lateRecordsForSaturday !== undefined) {
    const lateRecordsForSaturday = Number(form.lateRecordsForSaturday);
    if (!Number.isFinite(lateRecordsForSaturday) || lateRecordsForSaturday < 1 || lateRecordsForSaturday > 20) {
      throw new BaseError("Invalid saturday rule", "Los retardos por sábado deben estar entre 1 y 20", "validateAttendanceSettings", HttpStatusCode.BAD_REQUEST);
    }
    updateData.lateRecordsForSaturday = Math.trunc(lateRecordsForSaturday);
  }

  return updateData;
}

function getDatesInRange(startDate: string, endDate: string) {
  const dates: Date[] = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function isFederalHoliday(date: Date) {
  return getMexicoFederalHolidayDates(date.getFullYear()).has(formatDateKey(date));
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getWeekKey(week: ImportAttendanceWeekDto) {
  return week.weekKey || `${week.weekStartDate}_${week.weekEndDate}`;
}

function buildImportWeekSummary(week: ImportAttendanceWeekDto, weekKey: string, status: "GUARDADA" | "OMITIDA") {
  return {
    weekKey,
    weekLabel: week.weekLabel,
    weekStartDate: week.weekStartDate,
    weekEndDate: week.weekEndDate,
    status,
  };
}

function getInsertedWeekKeys(attendanceImport: AttendanceImportBase) {
  if (attendanceImport.weeks?.length) {
    return attendanceImport.weeks
      .filter((week) => week.status === "GUARDADA")
      .map((week) => week.weekKey);
  }

  return attendanceImport.insertedWeeks || [];
}

function isAttendanceDayField(field: string): field is AttendanceDayField {
  return ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].includes(field);
}

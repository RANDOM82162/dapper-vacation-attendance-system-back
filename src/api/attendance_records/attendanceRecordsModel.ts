import { connect, getMongoId } from "../../shared/database/mongodb";
import { BaseError } from "../../shared/classes/base-error";
import {
  AttendanceImportBase,
  AttendanceDayField,
  AttendanceRecordBase,
  AttendanceSettingsBase,
  GetAllAttendanceImportsFilters,
  GetAllAttendanceRecordsFilters,
  PaginacionRespuesta,
  UpdateAttendanceSettingsDto,
  UpdateAttendanceForgivenessDto,
  UpdateAttendancePermissionDto,
} from "./attendanceRecordsDto";

const COLLECTION = "attendance_records";
const IMPORTS_COLLECTION = "attendance_imports";
const SETTINGS_COLLECTION = "attendance_settings";
const DEFAULT_SETTINGS_KEY = "default";

export async function getAttendanceSettingsMongo(): Promise<AttendanceSettingsBase> {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceSettingsBase>(SETTINGS_COLLECTION);
    const now = new Date().getTime();
    const defaultSettings: AttendanceSettingsBase = {
      key: DEFAULT_SETTINGS_KEY,
      workdayStartTime: "09:00",
      lateToleranceMinutes: 5,
      lateRecordsForSaturday: 3,
      creationDateTS: now,
    };

    const response = await dbRef.findOneAndUpdate(
      { key: DEFAULT_SETTINGS_KEY },
      { $setOnInsert: defaultSettings },
      { upsert: true, returnDocument: "after" },
    );

    return (response as any).value || response || defaultSettings;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAttendanceSettingsMongo");
  }
}

export async function updateAttendanceSettingsMongo(form: UpdateAttendanceSettingsDto): Promise<AttendanceSettingsBase> {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceSettingsBase>(SETTINGS_COLLECTION);
    const now = new Date().getTime();

    const response = await dbRef.findOneAndUpdate(
      { key: DEFAULT_SETTINGS_KEY },
      {
        $set: {
          ...form,
          key: DEFAULT_SETTINGS_KEY,
          updateDateTS: now,
        },
        $setOnInsert: {
          creationDateTS: now,
        },
      },
      { upsert: true, returnDocument: "after" },
    );

    return (response as any).value || response;
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateAttendanceSettingsMongo");
  }
}

export async function countAttendanceRecordsByWeek(weekKey: string, weekStartDate: string): Promise<number> {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceRecordBase>(COLLECTION);
    const total = await dbRef.countDocuments({
      $or: [
        { weekKey },
        { weekStartDate },
      ],
    });

    return Number(total);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "countAttendanceRecordsByWeek");
  }
}

export async function insertAttendanceRecordsMongo(records: AttendanceRecordBase[]) {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceRecordBase>(COLLECTION);
    return await dbRef.insertMany(records);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "insertAttendanceRecordsMongo");
  }
}

export async function createAttendanceImportMongo(attendanceImport: AttendanceImportBase) {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceImportBase>(IMPORTS_COLLECTION);
    return await dbRef.insertOne(attendanceImport);
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "createAttendanceImportMongo");
  }
}

export async function getAttendanceImportById(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceImportBase>(IMPORTS_COLLECTION);
    return await dbRef.findOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAttendanceImportById");
  }
}

export async function deleteAttendanceImportMongo(id: string) {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceImportBase>(IMPORTS_COLLECTION);
    return await dbRef.deleteOne({ _id: getMongoId(id) });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteAttendanceImportMongo");
  }
}

export async function deleteAttendanceRecordsByImport(importId: string, weekKeys: string[]) {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceRecordBase>(COLLECTION);
    const queryOptions: any[] = [{ importId }];
    const mongoImportId = getMongoId(importId);

    if (mongoImportId) {
      queryOptions.push({ importId: mongoImportId });
    }

    if (weekKeys.length > 0) {
      queryOptions.push({ weekKey: { $in: weekKeys } });
    }

    return await dbRef.deleteMany({
      $or: queryOptions,
    });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "deleteAttendanceRecordsByImport");
  }
}

export async function updateAttendanceRecordPermissionMongo(id: string, form: UpdateAttendancePermissionDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceRecordBase>(COLLECTION);
    const recordId = getMongoId(id);
    const currentRecord = await dbRef.findOne({ _id: recordId });

    if (!currentRecord) return null;

    const storedPermissionOriginalValues = currentRecord.permissionOriginalValues;
    const permissionOriginalValues = storedPermissionOriginalValues && typeof storedPermissionOriginalValues === "object"
      ? storedPermissionOriginalValues
      : {};
    const currentValue = String(currentRecord[form.field] || "");
    const updateData: any = {
      updateDateTS: new Date().getTime(),
    };

    if (form.hasPermission) {
      updateData[form.field] = "Permiso";
      updateData.permissionOriginalValues = {
        ...permissionOriginalValues,
        [form.field]: permissionOriginalValues[form.field] || (currentValue === "Permiso" ? "Falta" : currentValue),
      };
    } else {
      updateData[form.field] = permissionOriginalValues[form.field] || "Falta";
      const nextPermissionOriginalValues = { ...permissionOriginalValues };
      delete nextPermissionOriginalValues[form.field];
      updateData.permissionOriginalValues = nextPermissionOriginalValues;
    }

    const summary = buildPermissionSummary({
      ...currentRecord,
      ...updateData,
      [form.field]: updateData[form.field],
    });

    updateData.observations = summary.observations;
    updateData.lateCount = summary.lateCount;
    updateData.permissionLateCount = summary.permissionLateCount;
    updateData.accumulatedLateCount = summary.accumulatedLateCount;
    updateData.accumulatedSaturdayCount = summary.accumulatedSaturdayCount;

    await dbRef.updateOne(
      { _id: recordId },
      {
        $set: updateData,
      },
    );

    return await dbRef.findOne({ _id: recordId });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateAttendanceRecordPermissionMongo");
  }
}

export async function updateAttendanceRecordForgivenessMongo(id: string, form: UpdateAttendanceForgivenessDto) {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceRecordBase>(COLLECTION);
    const recordId = getMongoId(id);
    const currentRecord = await dbRef.findOne({ _id: recordId });

    if (!currentRecord) return null;

    const updateData: any = {
      updateDateTS: new Date().getTime(),
    };

    if ("forgiveLateCount" in form) {
      updateData.forgivenLateCount = Boolean(form.forgiveLateCount);
    }

    if ("forgiveAccumulatedLateCount" in form) {
      const shouldForgive = Boolean(form.forgiveAccumulatedLateCount);
      updateData.forgivenAccumulatedLateCount = shouldForgive;

      if (shouldForgive) {
        updateData.forgivenOriginalAccumulatedLateCount =
          currentRecord.forgivenOriginalAccumulatedLateCount ?? currentRecord.accumulatedLateCount ?? 0;
        updateData.accumulatedLateCount = 0;
      } else {
        updateData.accumulatedLateCount = currentRecord.forgivenOriginalAccumulatedLateCount ?? currentRecord.accumulatedLateCount ?? 0;
      }
    }

    if ("forgiveAccumulatedSaturdayCount" in form) {
      const shouldForgive = Boolean(form.forgiveAccumulatedSaturdayCount);
      updateData.forgivenAccumulatedSaturdayCount = shouldForgive;

      if (shouldForgive) {
        updateData.forgivenOriginalAccumulatedSaturdayCount =
          currentRecord.forgivenOriginalAccumulatedSaturdayCount ?? currentRecord.accumulatedSaturdayCount ?? 0;
        updateData.forgivenOriginalSaturday = currentRecord.forgivenOriginalSaturday ?? currentRecord.saturday;
        updateData.forgivenOriginalSaturdayDueDate = currentRecord.forgivenOriginalSaturdayDueDate ?? currentRecord.saturdayDueDate;
        updateData.forgivenOriginalSaturdayStatus = currentRecord.forgivenOriginalSaturdayStatus ?? currentRecord.saturdayStatus;
        updateData.accumulatedSaturdayCount = 0;
        updateData.saturdayDueDate = "No generado";
        updateData.saturdayStatus = "Sin sábado";

        if (currentRecord.saturday === "Sin registro") {
          updateData.saturday = "No aplica";
        }
      } else {
        updateData.accumulatedSaturdayCount = currentRecord.forgivenOriginalAccumulatedSaturdayCount ?? currentRecord.accumulatedSaturdayCount ?? 0;
        updateData.saturdayDueDate = currentRecord.forgivenOriginalSaturdayDueDate ?? currentRecord.saturdayDueDate;
        updateData.saturdayStatus = currentRecord.forgivenOriginalSaturdayStatus ?? currentRecord.saturdayStatus;

        if (currentRecord.forgivenOriginalSaturday) {
          updateData.saturday = currentRecord.forgivenOriginalSaturday;
        }
      }
    }

    const summary = buildPermissionSummary({
      ...currentRecord,
      ...updateData,
    });

    updateData.observations = summary.observations;
    updateData.lateCount = summary.lateCount;
    updateData.permissionLateCount = summary.permissionLateCount;
    updateData.accumulatedLateCount = summary.accumulatedLateCount;
    updateData.accumulatedSaturdayCount = summary.accumulatedSaturdayCount;

    await dbRef.updateOne(
      { _id: recordId },
      {
        $set: updateData,
      },
    );

    return await dbRef.findOne({ _id: recordId });
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "updateAttendanceRecordForgivenessMongo");
  }
}

function buildPermissionSummary(record: AttendanceRecordBase) {
  const dayFields: AttendanceDayField[] = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const lateDayFields: AttendanceDayField[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const values = dayFields.map((field) => String(record[field] || ""));
  const computedLateCount = lateDayFields.map((field) => String(record[field] || "")).filter((value) => isLateAttendanceCell(value)).length;
  const lateCount = record.forgivenLateCount ? 0 : computedLateCount;
  const permissionLateCount = values.filter((value) => value === "Permiso").length;
  const missingCount = lateDayFields.map((field) => String(record[field] || "")).filter((value) => value === "Falta").length;
  const accumulatedLateCount = record.forgivenAccumulatedLateCount ? 0 : record.accumulatedLateCount || 0;
  const accumulatedSaturdayCount = record.forgivenAccumulatedSaturdayCount ? 0 : record.accumulatedSaturdayCount || 0;
  const observations = buildStoredObservation({
    lateCount,
    permissionLateCount,
    accumulatedLateCount,
    accumulatedSaturdayCount,
    missingCount,
  });

  return {
    lateCount,
    permissionLateCount,
    accumulatedLateCount,
    accumulatedSaturdayCount,
    observations,
  };
}

function buildStoredObservation(counts: { lateCount: number; permissionLateCount: number; accumulatedLateCount: number; accumulatedSaturdayCount: number; missingCount: number }) {
  if (counts.lateCount === 0 && counts.accumulatedSaturdayCount === 0 && counts.accumulatedLateCount === 0 && counts.permissionLateCount === 0 && counts.missingCount === 0) {
    return "Correcto";
  }

  const parts: string[] = [];

  if (counts.missingCount > 0) {
    parts.push(`${counts.missingCount} falta${counts.missingCount === 1 ? "" : "s"}`);
  }

  if (counts.lateCount > 0) {
    parts.push(`${counts.lateCount} retardo${counts.lateCount === 1 ? "" : "s"} semana`);
  }

  if (counts.accumulatedSaturdayCount > 0) {
    parts.push(`Debe ${counts.accumulatedSaturdayCount} sábado${counts.accumulatedSaturdayCount === 1 ? "" : "s"}`);
  }

  if (counts.accumulatedLateCount > 0) {
    parts.push(`${counts.accumulatedLateCount} día${counts.accumulatedLateCount === 1 ? "" : "s"} acumulado${counts.accumulatedLateCount === 1 ? "" : "s"}`);
  }

  if (counts.permissionLateCount > 0) {
    parts.push(`${counts.permissionLateCount} permiso${counts.permissionLateCount === 1 ? "" : "s"}`);
  }

  return parts.join(" | ");
}

function isLateAttendanceCell(value: string) {
  const firstPunch = value.match(/\d{1,2}:\d{2}/)?.[0];
  if (!firstPunch) return false;

  const [hours, minutes] = firstPunch.split(":").map(Number);
  return hours * 60 + minutes > 9 * 60 + 5;
}

export async function getAllAttendanceImportsMongo(
  filters: GetAllAttendanceImportsFilters,
): Promise<PaginacionRespuesta<AttendanceImportBase>> {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceImportBase>(IMPORTS_COLLECTION);
    const query: any = {};

    if (filters.year && filters.month) {
      const month = String(filters.month).padStart(2, "0");
      const monthRegex = new RegExp(`^${filters.year}-${month}`);
      query.$or = [
        { "weeks.weekStartDate": monthRegex },
        { "weeks.weekEndDate": monthRegex },
      ];
    } else if (filters.year) {
      const yearRegex = new RegExp(`^${filters.year}-`);
      query.$or = [
        { "weeks.weekStartDate": yearRegex },
        { "weeks.weekEndDate": yearRegex },
      ];
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const totalItems = Number(await dbRef.countDocuments(query));
    const data = await dbRef
      .find(query)
      .sort({ uploadedAtTS: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      data: data as AttendanceImportBase[],
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllAttendanceImportsMongo");
  }
}

export async function getAllAttendanceRecordsMongo(
  filters: GetAllAttendanceRecordsFilters,
): Promise<PaginacionRespuesta<AttendanceRecordBase>> {
  try {
    const db = await connect();
    const dbRef = db.collection<AttendanceRecordBase>(COLLECTION);
    const query: any = {};

    if (filters.weekKey) query.weekKey = filters.weekKey;
    const employeeQuery = buildEmployeeQuery(filters);
    if (employeeQuery) query.$or = employeeQuery;
    if (filters.department) query.department = filters.department;
    if (filters.startDate || filters.endDate) {
      query.weekStartDate = {};
      if (filters.startDate) query.weekStartDate.$gte = filters.startDate;
      if (filters.endDate) query.weekStartDate.$lte = filters.endDate;
    } else if (filters.year && filters.month) {
      const month = String(filters.month).padStart(2, "0");
      query.weekStartDate = new RegExp(`^${filters.year}-${month}`);
    } else if (filters.year) {
      query.weekStartDate = new RegExp(`^${filters.year}-`);
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const totalItems = Number(await dbRef.countDocuments(query));
    const data = await dbRef
      .find(query)
      .sort({ weekStartDate: -1, employeeName: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return {
      data: data as AttendanceRecordBase[],
      meta: {
        totalItems,
        totalPages: Math.ceil(Number(totalItems) / limit),
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  } catch (error) {
    throw new BaseError("Inside catch: ", error, "getAllAttendanceRecordsMongo");
  }
}

function buildEmployeeQuery(filters: GetAllAttendanceRecordsFilters) {
  const queryOptions: any[] = [];

  if (filters.employeeName) {
    queryOptions.push({ employeeName: new RegExp(`^${escapeRegex(filters.employeeName)}$`, "i") });
  }

  if (filters.employeeId) {
    queryOptions.push({ employeeId: new RegExp(`^${escapeRegex(filters.employeeId)}$`, "i") });
  }

  return queryOptions.length > 0 ? queryOptions : null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

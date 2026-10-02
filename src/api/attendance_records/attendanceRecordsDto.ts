import { ObjectId } from "mongodb";

export interface AttendanceRecordBase {
  _id: ObjectId;
  importId?: string;
  weekKey: string;
  weekLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  date: string;
  employeeId?: string;
  employeeName: string;
  department: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  saturdayDueDate: string;
  saturdayStatus: string;
  observations: string;
  lateCount: number;
  permissionLateCount: number;
  accumulatedLateCount: number;
  accumulatedSaturdayCount: number;
  permissionOriginalValues?: Partial<Record<AttendanceDayField, string>>;
  forgivenLateCount?: boolean;
  forgivenAccumulatedLateCount?: boolean;
  forgivenAccumulatedSaturdayCount?: boolean;
  forgivenOriginalAccumulatedLateCount?: number;
  forgivenOriginalAccumulatedSaturdayCount?: number;
  forgivenOriginalSaturday?: string;
  forgivenOriginalSaturdayDueDate?: string;
  forgivenOriginalSaturdayStatus?: string;
  sourceFileName?: string;
  creationDateTS: number;
  updateDateTS?: number;
}

export interface AttendanceImportBase {
  _id: ObjectId;
  sourceFileName?: string;
  uploadedAtTS: number;
  uploadedAtISO: string;
  weekKeys: string[];
  weeks: AttendanceImportWeekSummary[];
  insertedWeeks: string[];
  skippedWeeks: string[];
  insertedRecords: number;
  skippedRecords: number;
  uploadedBy?: string;
  creationDateTS: number;
}

export interface AttendanceImportWeekSummary {
  weekKey: string;
  weekLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  status: "GUARDADA" | "OMITIDA";
}

export interface ImportAttendanceRecordRowDto {
  employeeId?: string;
  employeeName: string;
  department: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  saturdayDueDate: string;
  saturdayStatus: string;
  observations: string;
  lateCount: number;
  permissionLateCount: number;
  accumulatedLateCount: number;
  accumulatedSaturdayCount: number;
  permissionOriginalValues?: Partial<Record<AttendanceDayField, string>>;
  forgivenLateCount?: boolean;
  forgivenAccumulatedLateCount?: boolean;
  forgivenAccumulatedSaturdayCount?: boolean;
  forgivenOriginalAccumulatedLateCount?: number;
  forgivenOriginalAccumulatedSaturdayCount?: number;
  forgivenOriginalSaturday?: string;
  forgivenOriginalSaturdayDueDate?: string;
  forgivenOriginalSaturdayStatus?: string;
}

export interface ImportAttendanceWeekDto {
  weekKey?: string;
  weekLabel: string;
  weekStartDate: string;
  weekEndDate: string;
  rows: ImportAttendanceRecordRowDto[];
}

export interface ImportAttendanceRecordsDto {
  sourceFileName?: string;
  weeks: ImportAttendanceWeekDto[];
}

export interface ImportAttendanceRecordsResult {
  insertedWeeks: string[];
  skippedWeeks: string[];
  insertedRecords: number;
  skippedRecords: number;
}

export interface DeleteAttendanceImportResult {
  deletedImport: boolean;
  deletedRecords: number;
}

export interface AttendanceSettingsBase {
  _id?: ObjectId;
  key: string;
  workdayStartTime: string;
  lateToleranceMinutes: number;
  lateRecordsForSaturday: number;
  creationDateTS?: number;
  updateDateTS?: number;
}

export interface UpdateAttendanceSettingsDto {
  workdayStartTime?: string;
  lateToleranceMinutes?: number;
  lateRecordsForSaturday?: number;
}

export type AttendanceDayField = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday";

export interface UpdateAttendancePermissionDto {
  field: AttendanceDayField;
  hasPermission: boolean;
  observations?: string;
  lateCount?: number;
  permissionLateCount?: number;
  accumulatedLateCount?: number;
  accumulatedSaturdayCount?: number;
}

export interface UpdateAttendanceForgivenessDto {
  forgiveLateCount?: boolean;
  forgiveAccumulatedLateCount?: boolean;
  forgiveAccumulatedSaturdayCount?: boolean;
}

export interface GetAllAttendanceRecordsFilters {
  weekKey?: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  year?: number;
  month?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface GetAllAttendanceImportsFilters {
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
}

export interface PaginacionRespuesta<T> {
  data: T[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

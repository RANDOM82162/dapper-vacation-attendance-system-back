import { ObjectId } from "mongodb";

export enum VacationRequestStatus {
  PENDIENTE = "Pendiente",
  APROBADA = "Aprobada",
  RECHAZADA = "Rechazada",
  CAMBIOS_SOLICITADOS = "Cambios solicitados",
  CANCELADA = "Cancelada",
}

export interface VacationHistoryEvent {
  message: string;
  timestamp: number;
}

export type VacationHistoryEntry = string | VacationHistoryEvent;

export interface VacationRequestBase {
  _id: ObjectId;
  folio: string;
  employeeId?: string;
  employeeName: string;
  department: string;
  managerId?: string;
  managerName?: string;
  startDate: string;
  endDate: string;
  days: number;
  paidDays?: number;
  unpaidDays?: number;
  comments?: string;
  managerComment?: string;
  status: VacationRequestStatus;
  updatedAt: string;
  history: VacationHistoryEntry[];
  googleCalendarEventId?: string;
  googleCalendarEventLink?: string;
  googleCalendarSyncedAt?: number;
  googleCalendarStatus?: "SYNCED" | "DELETED" | "ERROR" | "SKIPPED";
  googleCalendarError?: string;
  creationDateTS: number;
  updateDateTS?: number;
}

export interface CreateVacationRequestDto {
  employeeId?: string;
  employeeName: string;
  department: string;
  managerId?: string;
  managerName?: string;
  startDate: string;
  endDate: string;
  days?: number;
  comments?: string;
}

export interface UpdateVacationRequestDto extends Partial<
  Omit<VacationRequestBase, "_id" | "folio" | "creationDateTS" | "history">
> {}

export interface GetAllVacationRequestsFilters {
  search?: string;
  employeeId?: string;
  employeeName?: string;
  managerId?: string;
  status?: VacationRequestStatus;
  page?: number;
  limit?: number;
}

export interface VacationStatusChangeDto {
  comment?: string;
}

export interface PaginacionRespuesta<T> {
  data: T[];
  meta: {
    totalItems: number | void;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

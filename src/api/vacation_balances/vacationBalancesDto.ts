import { ObjectId } from "mongodb";

export interface VacationBalanceBase {
  _id: ObjectId;
  employeeId?: string;
  employeeName: string;
  department: string;
  hireDate?: string;
  year: number;
  serviceYears?: number;
  legalDays?: number;
  periodStartDate?: string;
  periodEndDate?: string;
  initialDays: number;
  usedDays: number;
  availableDays: number;
  lastMove?: string;
  movements?: string[];
  creationDateTS: number;
  updateDateTS?: number;
}

export interface CreateVacationBalanceDto {
  employeeId?: string;
  employeeName: string;
  department: string;
  hireDate?: string;
  year: number;
  serviceYears?: number;
  legalDays?: number;
  periodStartDate?: string;
  periodEndDate?: string;
  initialDays: number;
  usedDays?: number;
  availableDays?: number;
  lastMove?: string;
}

export interface UpdateVacationBalanceDto extends Partial<
  Omit<VacationBalanceBase, "_id" | "creationDateTS">
> {}

export interface GetAllVacationBalancesFilters {
  search?: string;
  employeeId?: string;
  employeeName?: string;
  department?: string;
  year?: number;
  referenceDate?: string;
  page?: number;
  limit?: number;
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

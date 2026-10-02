import { ObjectId } from "mongodb";

export enum EmployeeRole {
  EMPLEADO = "Empleado",
  JEFE_DIRECTOR = "Jefe/Director",
  ADMINISTRADOR = "Administrador",
}

export enum EmployeeStatus {
  ACTIVO = "ACTIVO",
  INACTIVO = "INACTIVO",
}

export interface EmployeeBase {
  _id: ObjectId;
  uid?: string;
  employeeNumber?: string;
  name: string;
  email?: string;
  department: string;
  hireDate: string;
  role: EmployeeRole;
  managerId?: string;
  managerName?: string;
  status: EmployeeStatus;
  creationDateTS: number;
  updateDateTS?: number;
}

export interface CreateEmployeeDto {
  uid?: string;
  employeeNumber?: string;
  name: string;
  email?: string;
  password?: string;
  department: string;
  hireDate: string;
  role: EmployeeRole;
  managerId?: string;
  managerName?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeDto extends Partial<
  Omit<EmployeeBase, "_id" | "creationDateTS">
> {
  password?: string;
}

export interface GetAllEmployeesFilters {
  search?: string;
  department?: string;
  role?: EmployeeRole;
  managerId?: string;
  status?: EmployeeStatus;
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

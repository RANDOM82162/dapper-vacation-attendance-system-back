import { Admin } from "./adminsModel";

export interface CreateAdminFormDto
  extends Omit<Admin, "_id" | "uid" | "creationDateTS"> {
  password: string;
}

export type CreateAdminDto = Omit<Admin, "_id">;

export type UpdateAdminDto = Omit<Admin, "_id" | "creationDateTS">;

export interface GetAllAdminsFilters {
  search?: string;
  page?: number;
  limit?: number;
  month?: number;
  year?: number;
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
